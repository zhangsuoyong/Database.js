# Database.js #
> 在日新月异的前端领域中，前端工程师能做的事情越来越多，自从nodejs出现后，前端越来越有革了传统后端命的趋势，本文就再补一刀，详细解读如何在js代码中执行标准的SQL语句
## 为什么要在js里写SQL？ ##
随着业务复杂度的增长，前端页面可能出现一些数据逻辑复杂的页面，传统的js逻辑处理起来比较复杂，我们先看两个例子：

![](http://img.58cdn.com.cn/zhuanzhuan/ZZOpenBusiness/other/img/art2.jpg)
> 比如多规格多库存商品界面，难点在于颜色分类、尺码、价格、库存、限购数量以及对应的图片展示之间有复杂的逻辑关系，用户进行不同的选择时，js要经过多次复杂的查询才能算出结果


![](http://img.58cdn.com.cn/zhuanzhuan/ZZOpenBusiness/other/img/art3.jpg)
> 比如地区联动查询界面，难点在于：
> 
1. 如何在本地存储地区数据，显然每次拉接口是不现实的，如果存储在storage里，每次使用时，需要有类似JSON.parse类的字符串转化为数组或对象的过程，这个操作在数据量大的时候，会造成页面卡顿，性能极差
2. 三级地区联动查询复杂，如果要从一个县级地区查询到所属的城市和省份，逻辑会比较复杂

----------
**上面两个例子，如果用传统js逻辑来写，大家头脑中必定已经设计好了算法，免不了用forEach、filter、some、find等各种ES678新方法，笔者开始也是用了各种酷炫的新方法写出来发现有两个问题：**

1. 写完之后逻辑很复杂，似乎没有100行代码实现不了（当然有大神比我活儿好）
2. 即使写了一大堆注释，同事们看起来还是一头雾水（因为逻辑确实很复杂。。。）

**笔者做过一段时间php开发（还做过PM、UI、QA等）忽然想能不能用SQL的方式实现呢？经过一番研究，笔者写了这样一个库：**

## Database.js ##

**Database.js基于Web SQL Database，那么Web SQL Database又是啥？**

> Web SQL Database是WHATWG(Web 超文本应用技术工作组，HTML5草案提出方)在2008 年 1 月提出的第一份正式草案，但并未包含在 HTML 5 规范之中，它是一个独立的规范，它引入了一套使用 SQL 操作客户端数据库的 API。由于提出时间较早，尽管 W3C 官方在 2011 年 11 月声明已经不再维护 Web SQL Database 规范，但这些 API 已经被广泛的实现在了不同的浏览器里，尤其是手机端浏览器。

**兼容情况**
![](http://img.58cdn.com.cn/zhuanzhuan/ZZOpenBusiness/other/img/art7.png)

**Web SQL Database 和 Indexed Database有啥区别？**
> Indexed Database 更类似于 NoSQL 的形式来操作数据库 , 其中最重要的是 Indexed Database 不使用 SQL 作为查询语言。

笔者为了实现在js里面写SQL的需求，果断采用了前者作为底层技术。

**Web SQL Database 三个核心方法：**

- openDatabase：这个方法使用现有数据库或新建数据库来创建数据库对象
- transaction：这个方法允许我们根据情况控制事务提交或回滚
- executeSql：这个方法用于执行SQL 查询

代码示例：
` 

	var db = openDatabase('testDB', '1.0', 'Test DB', 2 * 1024 * 1024);
    var msg;
    db.transaction(function (context) {
       context.executeSql('CREATE TABLE IF NOT EXISTS testTable (id unique, name)');
       context.executeSql('INSERT INTO testTable (id, name) VALUES (0, "Byron")');
       context.executeSql('INSERT INTO testTable (id, name) VALUES (1, "Casper")');
       context.executeSql('INSERT INTO testTable (id, name) VALUES (2, "Frank")');
     });
` 
**对于没有SQL经验的前端同学来讲，上面代码看起来显然有点陌生，也不太友好，于是Database.js诞生了：**
> 笔者以业务当中的一个需求举例：
> **转转游戏业务列表页**筛选菜单是一个三级联动菜单，每个菜单变动都会影响其他菜单数据，如图：
> 
![](http://img.58cdn.com.cn/zhuanzhuan/ZZOpenBusiness/other/img/art4.jpg)

**原始JSON数据结构**

![](http://img.58cdn.com.cn/zhuanzhuan/ZZOpenBusiness/other/img/art5.jpg)

可以看出是3级嵌套结构，笔者处理成了扁平化的数据结构（过程略），并分别存入三个数据库，分别存储游戏名称、游戏平台、商品类型，如下图：

![](http://img.58cdn.com.cn/zhuanzhuan/ZZOpenBusiness/other/img/art6.jpg)

举例游戏名称数据结构如下图：

![](http://img.58cdn.com.cn/zhuanzhuan/ZZOpenBusiness/other/img/art7.jpg)

**通过chrome控制台Application面板可以直接看到数据库，结构、数据清晰可见**

**核心代码如下：**
` 

     /**
       * 打开数据库
       * @returns {Promise.<void>}
       */
      openDataBase(){
		//打开数据库，没有则创建
        db.openDatabase('GameMenu',1,'zzOpenGameMenu').then(res=>{
		  //检测数据库是否存在	
          db.isExists('game').then(res=>{
            //数据库已经存在，直接使用,将数据交付给页面UI组件
            this.setSelectData()
          }).catch(e=>{
            //数据库不存在，请求接口并处理数据，然后存入数据库
            this.getData()
          })
        }).catch(e=>{
          console.err(e)
        })
      },
	 /**
       * 获取分类数据并存储到数据库
       * @returns {Promise.<void>}
       */
      async getData(){
		//接口请求数据并处理成三个扁平数组
        let data =  await this.getMenuData()
        for(let i in data){
		  //创建表并存储数据	
          db.create(i,data[i])
        }
		//将数据交付给页面UI组件
        this.setSelectData()
      },
` 
**当任意菜单选择变更时，三列数据将重新查询，核心代码如下：**
` 

	 /**
       * 重新查询数据
       * @param data 点击菜单携带的数据
       * @param index 点击菜单的序号
       * @param all 三个菜单当前选中数据
       */
      async onSelect(data,index,all){
        let target = [],condition = {}
		//业务逻辑：处理查询条件
        if(all['0'] && all['0']['name']!=defaultData[0].default.name)condition['gameName'] = all['0']['name']
        if(all['1'] && all['1']['name']!=defaultData[1].default.name)condition['platName'] = all['1']['name']
        if(all['2'] && all['2']['name']!=defaultData[2].default.name)condition['typeName'] = all['2']['name']

		//创建三个查询任务
        let tasks = ['game','plat','type'].map((v,k)=>{
			//使用db.select方法查询
            return db.select(v,this.formatCondition(v,condition),'name,value','rowid desc','name').then((res)=>{
              target.push({
                options:res.data,
                defaultOption:defaultData[k].default,
                clickHandle:this.onSelect
              })
            })
        })
		//执行查询
        await Promise.all(tasks)
		//将数据交付给联动菜单组件使用
        this.selectData = target
      }

**以上代码即可完成联动菜单所需要的数据管理工作，看起来是不是比较清晰？**


----------

**使用Database.js的优势**

>**1.将数据结构化存储于Storage中，避免了以文本形式存入Storage或cookie中再解析的性能消耗流程。**

>**2.将复杂数据清晰的在前端进行管理和使用，代码逻辑更清晰，数据查询更简洁！**
----------


## Database.js使用文档 ##

**openDatabase**
- 功能：打开数据库，不存在则创建
- 语法：openDatabase(dbName,dbVersion,dbDescription,dbSize,callback)
- 参数：
	- dbName：数据库名
	- dbVersion：数据库版本（打开已存在数据库时，版本号必须一致，否则会报错）
	- dbDescription：数据库描述
	- dbSize：数据库预设大小，默认1M
	- callback：回调函数

**query**
- 功能：执行sql语句，支持多表查询
- 语法：query(sqlStr,args = [],callback,errorCallback)
- 参数：
	- sqlStr：sql语句
	- args（Array）：传入的数据，替换sql中的?符号
	- callback:成功回调
	- errorCallback：失败回调
- 示例：
` 
	  //插入数据
      db.query('INSERT INTO testTable(id,title) VALUES (?,?)',[1,'这是title'])
	  
      //多表查询
     db.query('select game.*,plat.* from game left join plat on game.name = plat.gameName')
` 


**isExists**
- 功能：检测表是否存在
- 语法：isExists(tableName)
- 参数：
	- tableName：表名

**createTable**
- 功能：创建一张表
- 语法：createTable(tableName,fields)
- 参数：
	- tableName：表名
	- fields：表结构(需指定字段类型)
- 示例：
` 

      db.createTable('testTable',{
          name:'varchar(200)',
          price:'int(100)'
      })
` 

**insert**
- 功能：插入一条或多条数据
- 语法：insert(tableName,data)
- 参数：
	- tableName：表名
	- data（Object or Array）：插入的数据，多条数据请传入数组类型
- 示例：
` 
	  //插入单条	
      db.insert('testTable',{
		name:'商品1',
		price:10
	  })
	  //插入多条	
      db.insert('testTable',[
        {name:'商品1',price:10},
        {name:'商品2',price:20},
        {name:'商品3',price:30},
      ])
` 

>**将数据存入数据库的常规流程是先createTable，然后再insert，如果你觉得这样麻烦，可以试一下create方法：**

**create**
- 功能：直接创建数据库并存入数据
- 注意：类库会根据传入的数据类型自动设置数据库的字段类型，这样可以覆盖大多数需求，但如果你的数据中，同一个字段中有不同的数据类型，有可能不能兼容，建议还是使用常规流程手动设置类型
- 语法：create(tableName,data)
- 参数：
	- tableName：表名
	- data（Object or Array）：插入的数据，多条数据请传入数组类型
- 示例：
` 
	 
	  //直接创建表并存储
      db.create('testTable',[
        {name:'商品1',price:10},
        {name:'商品2',price:20},
        {name:'商品3',price:30},
      ])
` 

**delete**
- 功能：删除数据
- 语法：delete(tableName,condition)
- 参数：
	- tableName：表名
	- condition（String or Obejct）：查询条件
- 示例：
` 
	 
	  //删除一条数据
      db.delete('testTable',{name:'商品1'})

` 

>关于condition：
>**1、传入array形式时，默认查询条件连接方式是AND，如果需要用OR等方式，可以在condition中传入_logic设定，例如{_logic：'OR'}**
>**2、如果查询条件有AND、OR等多种方式，建议使用string方式传入**

**select**
- 功能：查询数据
- 注意：如果需要多表查询，可参照query方法
- 语法：select(tableName,condition = '',fields = '*',order = '',group = '',limit = '')
- 参数：
	- tableName：表名
	- condition（String or Obejct）：查询条件
	- fields（String or Array）：返回字段，默认*，支持distinct
	- order（String or Array）：排序规则
	- group（String or Array）：分组规则
	- limit（String or Array）：分页规则
- 示例：
` 
	 
	  //查询name=商品1的数据，并按照price倒序
      db.select('testTable',{
		    name:'商品1'
		},'*','price desc')

      //查询价格大于0的商品，并用distinct关键字去重
      db.select('testTable',{
		    price:'>0'
		},'distinct name,pirce','price desc')

` 

**update**
- 功能：更新数据
- 语法：update(tableName,data,condition = '')
- 参数：
	- tableName：表名
	- data（String or Obejct）：更改数据
	- condition（String or Obejct）：查询条件
- 示例：
` 
	 
	  //将商品1的价格改为99
      db.update('testTable',{
		    price:99
		},{
			name:'商品1'
		})

` 

**truncate**
- 功能：清空表
- 语法：truncate(tableName)
- 参数：
	- tableName：表名

**drop**
- 功能：删除表
- 语法：drop(tableName)
- 参数：
	- tableName：表名


# 如何使用Database.js #


>Github地址：https://github.com/zhangsuoyong/Database.js

**如果你有更好的想法，欢迎与我交流，个人微信号：king109400214**


**更多前端新鲜文章，请关注我司公众号“大转转FE”**