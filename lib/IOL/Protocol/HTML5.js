/**
 * @requires IOL.js
 */
IOL.namespace("IOL.Protocol");

IOL.Protocol.HTML5 = OpenLayers.Class(OpenLayers.Protocol.SQL, {
    
    /**
     * Property: maxId
     * {Integer} Used internally to keep track of max feature id.
     */
    maxId: 0,
    
    /**
     * Property: databaseVersion
     * {String} Optional database verion number.  Default is "".
     */
    databaseVersion: "",
    
    /**
     * Property: db
     * {Database}
     */
    db: null,

    /**
     * Constructor: IOL.Protocol.HTML5
     * Create a new HTML5 protocol.
     *
     * Parameters:
     * options - {Object} Optional properties to be set on the protocol.
     */
    initialize: function(options) {
        if(this.supported()) {
            OpenLayers.Protocol.prototype.initialize.apply(this, [options]);
            if(!this.format) {
                this.format = new OpenLayers.Format.GeoJSON();
            }
            this.initializeDatabase();
        }
    },
    
    /**
     * Method: destroy
     * Clean up.
     */
    destroy: function() {
        if(!this.options || !this.options.format) {
            this.format.destroy();
        }
        this.format = null;
        OpenLayers.Protocol.SQL.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * APIMethod: supported
     * Determine whether the backend is supported.
     *
     * Returns:
     * {Boolean} The browser supports the SQL backend.
     */
    supported: function() {
        return (typeof window.openDatabase === "function");
    },
    
    /**
     * Method: initializeDatabase
     */
    initializeDatabase: function() {
        this.db = openDatabase(this.databaseName, this.databaseVersion);
        this.transaction(function(tx) {
            this.executeSql(
                tx,
                "CREATE TABLE IF NOT EXISTS " + this.tableName +
                    " (id INTEGER PRIMARY KEY, feature TEXT)",
                [],
                this.executeSql(
                    tx,
                    "SELECT MAX(id) as count FROM " + this.tableName,
                    [],
                    function(tx, result) {
                        this.maxId = result.rows.item(0).count || 0;
                    }
                )
            )
        });
    },
    
    /**
     * Method: transaction
     * Triggers a transaction on the database.  Binds all callbacks to this protocol.
     *
     * Parameters:
     * execute - {Function} The sql transaction callback to execute.
     * failure - {Function} The error callback.
     * success - {Function} The success callback.
     */
    transaction: function(execute, failure, success) {
        this.db.transaction(
            OpenLayers.Function.bind(execute, this),
            OpenLayers.Function.bind(failure || (new Function), this),
            OpenLayers.Function.bind(success || (new Function), this)
        );
    },
    
    /**
     * Method: executeSql
     * Call transaction.executeSql with callbacks bound to this protocol.
     *
     * Parameters:
     * transaction - {Transaction}
     * sql - {String} The SQL to execute
     * args - {Array} A list of arguments for ? replacement in the sql
     * callback - {Function} The statement callback.
     * failure - {Function} The statement error callback.
     */
    executeSql: function(transaction, sql, args, callback, failure) {
        transaction.executeSql(
            sql, args,
            OpenLayers.Function.bind(callback || (new Function), this),
            OpenLayers.Function.bind(failure || (new Function), this)
        );
    },

    /**
     * Method: read
     * Read all features from the database and return a
     *     <OpenLayers.Protocol.Response> instance. If the options parameter
     *     contains a callback attribute, the function is called with the response
     *     as a parameter.
     *
     * Parameters:
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *      object.
     */
    read: function(options) {
        options = OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({requestType: "read"});
        this.transaction(function(tx) {
            this.executeSql(tx, "SELECT * from " + this.tableName, [],
                function(tx, result) {
                    response.priv = {transaction: tx, result: result};
                    this.handleResponse(response, options);
                },
                function(tx, error) {
                    response.priv = {transaction: tx, error: error};
                    this.handleResponse(response, options);
                }
            );
        });
    },
    
    /**
     * Method: create
     * Construct a request for writing newly created features.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *     {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} A response object, whose "priv"
     *     property references the transaction, this object is also passed to
     *     the callback function when the request completes.
     */
    create: function(feature, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({
            reqFeatures: [feature], requestType: "create"
        });
        this.transaction(function(tx) {
            this.executeSql(
                tx,
                "INSERT INTO " + this.tableName + " (id, feature) VALUES (?, ?)",
                [this.maxId + 1, this.format.write(feature)],
                function(tx, result) { 
                    response.priv = {transaction: tx, result: result};
                    this.handleResponse(response, options);
                },
                function(tx, error) {
                    response.priv = {transaction: tx, error: error};
                    this.handleResponse(response, options);
                }
            );
        });
    },

    /**
     * Method: update
     * Construct a request updating modified feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} A response object, whose "priv"
     *     property references the transaction, this object is also passed to
     *     the callback function when the request completes, its "features"
     *     property is then populated with the the feature received from the
     *     database.
     */
    update: function(feature, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({
            reqFeatures: [feature], requestType: "update"
        });
        this.transaction(function(tx) {
            this.executeSql(
                tx,
                "REPLACE INTO "+ this.tableName + " (id, feature) VALUES (?, ?)",
                [feature.fid, this.format.write(feature)],
                function(tx, result) { 
                    response.priv = {transaction: tx, result: result};
                    this.handleResponse(response, options);
                },
                function(tx, error) {
                    response.priv = {transaction: tx, error: error};
                    this.handleResponse(response, options);
                }
            );
        });
    },

    /**
     * Method: delete
     * Construct a request deleting a removed feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} A response object, whose "priv"
     *     property references the transaction, this object is also passed to
     *     the callback function when the request completes.
     */
    "delete": function(feature, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({
            reqFeatures: [feature], requestType: "delete"
        });
        this.transaction(function(tx) {
            this.executeSql(tx, "DELETE FROM " + this.tableName + " where id=?",
                [feature.fid],
                function(tx, result) { 
                    response.priv = {transaction: tx, result: result};
                    this.handleResponse(response, options);
                },
                function(tx, error) {
                    response.priv = {transaction: tx, error: error};
                    this.handleResponse(response, options);
                }
            );
        });
    },
    
    /**
     * Method: handleResponse
     * Deals with responses and calls any specified callback.
     *
     * Parameters:
     * response - {OpenLayers.Protocol.Response} The response.
     * options - {Object}
     */
    handleResponse: function(response, options) {
        var result = response.priv.result;
        if(result) {
            switch(response.requestType) {
                case "create":
                    this.maxId = result.insertId;
                    break;
                case "read":
                    var row, feature;
                    var len = result.rows.length;
                    response.features = new Array(len);
                    for(var i=0; i<len; ++i) {
                        row = result.rows.item(i);
                        feature = this.format.read(row["feature"], "Feature");
                        feature.fid = row["id"];
                        response.features[i] = feature;
                    }
                    break;
            }
            response.code = OpenLayers.Protocol.Response.SUCCESS;
        } else {
            response.code = OpenLayers.Protocol.Response.FAILURE;
        }
        if(options.callback) {
            options.callback.call(options.scope, response);
        }
    },
    
    /**
     * Method: commit
     * Iterate over each feature and take action based on the feature state.
     *     Possible actions are create, update and delete.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})}
     * options - {Object} Optional object for setting up intermediate commit
     *     callbacks.
     *
     * Valid options:
     * create - {Object} Optional object to be passed to the <create> method.
     * update - {Object} Optional object to be passed to the <update> method.
     * delete - {Object} Optional object to be passed to the <delete> method.
     * callback - {Function} Optional function to be called when the commit
     *     is complete.
     * scope - {Object} Optional object to be set as the scope of the callback.
     *
     * Returns:
     * {Array(<OpenLayers.Protocol.Response>)} An array of response objects,
     *     one per request made to the server, each object's "priv" property
     *     references the corresponding HTTP request.
     */
    commit: function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options || {});
        var resp = [], nResponses = 0;
        
        // Divide up features before issuing any requests.  This properly
        // counts requests in the event that any responses come in before
        // all requests have been issued.
        var types = {};
        types[OpenLayers.State.INSERT] = [];
        types[OpenLayers.State.UPDATE] = [];
        types[OpenLayers.State.DELETE] = [];
        var feature, list;
        for(var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            list = types[feature.state];
            if(list) {
                list.push(feature);
            }
        }
        // tally up number of requests
        var nRequests = (types[OpenLayers.State.INSERT].length > 0 ? 1 : 0) +
            types[OpenLayers.State.UPDATE].length +
            types[OpenLayers.State.DELETE].length;
        
        var success = true;
        var finalResponse = new OpenLayers.Protocol.Response({
            reqFeatures: feature
        });
        finalResponse.insertIds = new Array(types[OpenLayers.State.INSERT].length);
        function insertCallback(index) {
            return function(response) {
                finalResponse.insertIds[index] = response.priv.result && response.priv.result.insertId;
                callback.apply(this, [response]);
            }
        }
        function callback(response) {
            this.callUserCallback(response, options);
            success = success && response.success();
            nResponses++;
            if(nResponses >= nRequests) {
                if(options.callback) {
                    finalResponse.code = success ?
                        OpenLayers.Protocol.Response.SUCCESS :
                        OpenLayers.Protocol.Response.FAILURE;
                    options.callback.apply(options.scope, [finalResponse]);
                }
            }
        }
        
        // start issuing requests
        var queue = types[OpenLayers.State.INSERT];
        for(var i=queue.length-1; i>=0; --i) {
            resp.push(this.create(
                queue[i], OpenLayers.Util.applyDefaults(
                    {callback: insertCallback(i), scope: this},
                    options.create || {} // remove || when #1716 is resolved
                )
            ));
        }
        queue = types[OpenLayers.State.UPDATE];
        for(var i=queue.length-1; i>=0; --i) {
            resp.push(this.update(
                queue[i], OpenLayers.Util.applyDefaults(
                    {callback: callback, scope: this}, 
                    options.update || {} // remove || when #1716 is resolved
                ))
            );
        }
        queue = types[OpenLayers.State.DELETE];
        for(var i=queue.length-1; i>=0; --i) {
            resp.push(this["delete"](
                queue[i], OpenLayers.Util.applyDefaults(
                    {callback: callback, scope: this},
                    options["delete"] || {} // remove || when #1716 is resolved
                ))
            );
        }
        return resp;
    },

    /**
     * Method: callUserCallback
     * This method is used from within the commit method each time an
     *     an transaction completes, it is responsible for calling the
     *     user-supplied callbacks.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>}
     * options - {Object} The map of options passed to the commit call.
     */
    callUserCallback: function(resp, options) {
        var opt = options[resp.requestType];
        if(opt && opt.callback) {
            opt.callback.call(opt.scope, resp);
        }
    },

    
    CLASS_NAME: "IOL.Protocol.HTML5"
});    

