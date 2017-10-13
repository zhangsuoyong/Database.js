import Database from '../src/Database.js'
let db = new Database()
db.openDatabase('testDatabase',1,'demo').then((res)=> {
    db.createTable('testTable',{
         name:'varchar(200)',
         price:'int(100)'
    })
     let data = [
       {name:'商品1',price:80},
       {name:'商品2',price:10},
       {name:'商品3',price:870},
       {name:'商品4',price:680},
       {name:'商品5',price:250},
       {name:'商品6',price:80},
     ]
     db.insert('testTable',data)

     db.select('testTable',{
         price:['>',100]
     },'*','price desc').then(res=>{
         console.log(res)
     })

    db.select('testTable','price < 200','*','price desc').then(res=>{
        console.log(res)
    })

    db.update('testTable',{price:99},{
        name:'商品2'
    }).then(res=>{
        db.select('testTable',{name:'商品2'},'price').then(res=>{
                console.log(res)
        })
    })
})

