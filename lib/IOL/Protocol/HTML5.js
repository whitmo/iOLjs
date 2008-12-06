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
                    this.handleRead(response, options);
                },
                function(tx, error) {
                    response.priv = {transaction: tx, error: error};
                    this.handleRead(response, options);
                }
            );
        });
    },

    /**
     * Method: handleRead
     * Deal with response from the read request.
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>} The response object to pass
     *     to the user callback.
     * options - {Object} The user options passed to the read call.
     */
    handleRead: function(response, options) {
        var result = response.priv.result;
        if(result) {
            var row, feature;
            var len = result.rows.length;
            response.features = new Array(len);
            for(var i=0; i<len; ++i) {
                row = result.rows.item(i);
                feature = this.format.read(row["feature"], "Feature");
                feature.fid = row["id"];
                response.features[i] = feature;
            }
            response.code = OpenLayers.Protocol.Response.SUCCESS;
        } else {
            response.code = OpenLayers.Protocol.Response.FAILURE;
        }
        if(options.callback) {
            options.callback.call(options.scope, response);
        }
    },

    
    create: function(feature, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options || {});

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: [feature],
            requestType: "create"
        });

        this.transaction(function(tx) {
            this.executeSql(
                tx,
                "INSERT INTO " + this.tableName + " (id, feature) VALUES (?, ?)",
                [this.maxId + 1, this.format.write(feature)],
                function(tx, result) { 
                    feature.fid = result.insertId; 
                    this.maxId = result.insertId; 
                }
            );
        });
    },
    
    'delete': function(feature) {
        this.transaction(function(tx) {
            this.executeSql(tx, "DELETE FROM " + this.tableName + " where id=?",
                [feature.fid]
            );
        });
    },

    update: function(feature) {
        this.transaction(function(tx) {
            this.executeSql(
                tx,
                "REPLACE INTO "+ this.tableName + " (id, feature) VALUES (?, ?)",
                [feature.fid, this.format.write(feature)]
            );
        });
    },
    
    CLASS_NAME: "OpenLayers.Protocol.HTML5"
});    

