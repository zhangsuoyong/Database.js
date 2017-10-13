export default class Database {

    db = null;//database handle
    dbInfo = [];//database info arr
    defaultSize = 1*1024*1024;//default database size 1M

    constructor(dbName,dbVersion,dbDescription = '',dbSize = this.defaultSize,callback){
        dbName && this.openDatabase(dbName,dbVersion,dbDescription,dbSize,callback)
    };

    /**
     * openDatabase
     * if not exsit create a new one
     * if dbVersion is not exsit, method will throw error
     * @param {string} dbName
     * @param {string} dbVersion
     * @param {string} dbDescription
     * @param {number} dbSize
     * @param {function} *callback
     * @returns {*}
     */
    async openDatabase(dbName,dbVersion,dbDescription = '',dbSize = this.defaultSize,callback){
        //test if support
        if(!window.openDatabase){
            throw 'This browser don`t support Web Sql Databases'
        }

        //save database info
        this.dbInfo = [dbName,dbVersion,dbDescription,dbSize,callback]

        //opon database
        try {
            this.db = window.openDatabase(...this.dbInfo);
            return Promise.resolve(this)
        }catch (e){
            console.error(e)
            return Promise.reject(e)
        }
    };

    /**
     * execute sql
     * @param {string} sqlStr
     * @param {array} args
     * @param {function} callback
     * @param {function} errorCallback
     * @returns {Promise.<*>}
     */
    async query(sqlStr,args = [],callback,errorCallback){
        console.info(sqlStr)
        return new Promise((resolve,reject)=>{
                try {
                    this.db.transaction((tx)=>{
                    tx.executeSql(sqlStr,args,(tx,result)=>{
                    result.data = result && result.rows ? Array.from(result.rows) : []
                callback && callback(tx,result)
        resolve(result)
    },(tx,result)=>{
            errorCallback && errorCallback(tx,result)
            reject(result)
        })
    })
    }catch(e){
            console.error(e)
            reject(e)
        }
    })

    };

    /**
     * create a table
     * @param {string} tableName
     * @param {object} fields
     */
    async createTable(tableName,fields){
        let fieldsArr = []
        for(let k in fields){
            fieldsArr.push(`${k} ${fields[k]}`)
        }
        return await this.query(`CREATE TABLE IF NOT EXISTS ${tableName}(${fieldsArr.join(',')})`)
    };

    /**
     * check is exist table
     * @param {string} tableName
     * @returns {Promise.<*>}
     */
    async isExists(tableName){
        return await this.query(`SELECT * FROM ${tableName} WHERE 1 LIMIT 1`)
    }
    /**
     * insert method
     * @param {string} tableName
     * @param {object/array} data
     * @returns {Promise.<*>}
     */
    async insert(tableName,data){
        if(typeof data != 'object')throw('wrong data,only object or array')
        if(Object.prototype.toString.call(data) == '[object Object]'){
            data = [data]
        }

        let result = []
        for(let i = 0;i<data.length;i++){
            let values = Object.values(data[i]).map((v)=>{
                    return this.formatValue(v)
                })
            let res =  this.query(`INSERT INTO ${tableName} (${Object.keys(data[i]).join(',')}) VALUES (${values.join(',')})`)
            result.push(res)
        }
        return result
    }

    /**
     * delete method
     * @param tableName
     * @param condition
     * @returns {Promise.<void>}
     */
    async delete(tableName,condition){
        let conditionStr = this.formatCondition(condition)
        return await this.query(`DELETE FROM ${tableName} ${conditionStr}`)
    }

    /**
     * select method
     * @param {string} tableName
     * @param {string/array} condition
     * @param {string/array} fields
     * @param {string/array} order
     * @param {string/array} group
     * @param {string/array} limit
     * @returns {Promise.<*>}
     */
    async select(tableName,condition = '',fields = '*',order = '',group = '',limit = ''){
        let conditionStr = this.formatCondition(condition)
        let fieldsStr = this.formatField(fields)
        let orderStr = this.formatOrder(order)
        let limitStr = this.formatLimit(limit)
        let groupStr = this.formatGroup(group)
        return await this.query(`SELECT ${fieldsStr} FROM ${tableName} ${conditionStr} ${groupStr} ${orderStr} ${limitStr}`)
    }

    /**
     * update methods
     * @param {string} tableName
     * @param {object} data
     * @param {string/array} condition
     * @returns {Promise.<*>}
     */
    async update(tableName,data,condition = ''){
        let conditionStr = this.formatCondition(condition)
        let dataStr = this.formatData(data)
        return await this.query(`UPDATE ${tableName} SET ${dataStr}  ${conditionStr}`)
    }

    /**
     * create methods
     * @param {string} tableName
     * @param {object/array} data
     * @returns {Promise}
     */
    async create(tableName,data){
        if(typeof data != 'object')throw('wrong data,only object or array')
        if(Object.prototype.toString.call(data) == '[object Object]'){
            data = [data]
        }
        return new Promise((resolve,reject)=>{
                this.isExists(tableName).then(()=>{
                data.forEach((n)=>{
                this.insert(tableName,n)
    })
    }).catch(()=>{
            let fields = {}
            Object.keys(data[0]).forEach((n)=>{
            fields[n] = 'varchar(255)'
        })
        this.createTable(tableName,fields).then(()=>{
            data.forEach((n)=>{
            this.insert(tableName,n)
    })
    })
    })
    })
    }

    /**
     * sql drop methods
     * @param {string} tableName
     * @returns {Promise.<*>}
     */
    async drop(tableName){
        return await this.query(`DROP TABLE ${tableName}`)
    }

    /**
     * truncate methods
     * @param {string} tableName
     * @returns {Promise.<void>}
     */
    async truncate (tableName){
        return await this.delete(tableName)
    }
    /**
     * format params
     * @param params
     */
    formatParams(params) {
        if (typeof params === 'string') {
            return `${params}`
        } else if (typeof params === 'object') {
            let _logic = params._logic || 'AND'
            let result = []
            for (let k in params) {
                if (k != '_logic') {
                    let v = params[k]
                    if (Array.isArray(v)) {
                        if (v.length == 1) {
                            result.push(`${k} = ${this.formatValue(v[0])}`)
                        } else {
                            v[1] = this.formatValue(v[1])
                            result.push(`${k} ${v.join(' ')}`)
                        }
                    } else {
                        result.push(`${k} = ${this.formatValue(v)}`)
                    }
                }
            }
            return `${result.join(` ${_logic} `)}`
        }else if(typeof params == 'undefined'){
            return ''
        }else {
            throw('wrong params,must be object or string')
        }
    }

    /**
     * format condition
     * @param condition
     * @returns {string}
     */
    formatCondition(condition){
        let result = this.formatParams(condition)
        return result ? `WHERE ${result}` : ''
    }

    /**
     * format data
     * @param data
     * @returns {*|string}
     */
    formatData(data){
        if(typeof data == 'object'){
            data._logic = ','
        }
        let result = this.formatParams(data)
        return result || ''
    }

    /**
     * format field
     * @param fields
     * @returns {*}
     */
    formatField(fields){
        if(Array.isArray(fields)){
            return fields.join(',')
        }else if(typeof fields == 'string'){
            return fields
        }else {
            throw('wrong fields,must be array or string')
        }
    }

    /**
     * format limit
     * @param limit
     * @returns {string}
     */
    formatLimit(limit){
        if(Array.isArray(limit)){
            return limit.length ? `LIMIT ${limit.join(',')}` : ''
        }else if(typeof limit == 'string'){
            return limit ? `LIMIT ${limit}` : ''
        }else {
            throw('wrong limit,must be array or string')
        }
    }

    /**
     * format group
     * @param group
     * @returns {string}
     */
    formatGroup(group){
        if(Array.isArray(group)){
            return group.length ? `GROUP BY ${group.join(',')}` : ''
        }else if(typeof group == 'string'){
            return group ? `GROUP BY ${group}` : ''
        }else {
            throw('wrong group,must be array or string')
        }
    }

    /**
     * format order
     * @param order
     * @returns {string}
     */
    formatOrder(order){
        if(Array.isArray(order)){
            return order.length ? `ORDER BY ${order.join(',')}` : ''
        }else if(typeof order == 'string'){
            return order ? `ORDER BY ${order}` : ''
        }else {
            throw('wrong order,must be array or string')
        }
    }

    /**
     * format value
     * @param v
     * @returns {string}
     */
    formatValue(v){
        return typeof v != 'number' ? `'${v}'` : v
    }
}
