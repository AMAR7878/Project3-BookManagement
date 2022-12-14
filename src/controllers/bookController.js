const bookModel= require ("../models/bookModel")
const reviewModel=require("../models/reviewModel")
const userModel=require("../models/userModel")
const moment = require('moment')
const mongoose = require('mongoose')


const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    if (typeof value === "object" && Object.keys(value).length === 0) return false;
    return true;
};

const createbook = async function(req, res){
try {
    let data = req.body
    data['releasedAt'] = moment(new Date()).format("YYYY-MM-DD")
    let{title, excerpt, userId, ISBN, category, subcategory} = data

    if (!isValid(data)) {
        return res.status(400).send({ status: false, msg: "You have not provided any data" })
    }
    if(!isValid(title)){
        return res.status(400).send({ status: false, msg: "provide book title. it's mandatory" })
    }else{
        title = title.trim().split(' ').filter(word => word).join(' ')
    }
    let checktitle = await bookModel.findOne({ title: title })
    if (checktitle) {
        return res.status(400).send({ status: false, msg: `${title} => title is already reserved` })
    }
    if(!isValid(excerpt)){
        return res.status(400).send({ status: false, msg: "provide excerpt. it's mandatory" })
    }else{
        excerpt = excerpt.trim().split(' ').filter(word => word).join(' ')
    }
    if(!isValid(userId)){
        return res.status(400).send({ status: false, msg: "please provide userId. it's mandatory" })
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ status: false, msg: "AuthorId is not valid,please enter valid ID" })
    }
    let userbyid = await userModel.findById(userId)
    if (!userbyid) {
        return res.status(400).send({ status: false, msg: "user is not exist" })
    }
    if(!isValid(ISBN)){
        return res.status(400).send({ status: false, msg: "provide ISBN Number. it's mandatory" })
    }
    let checkISBN= await bookModel.findOne({ISBN: ISBN})
    if (checkISBN) {
        return res.status(400).send({ status: false, msg: `choose another ISBN number.${ISBN} is already exist` })
    }
    if(!isValid(category)){
        return res.status(400).send({ status: false, msg: "provide book category. it's mandatory" })
    }
    if(!isValid(subcategory)){
        return res.status(400).send({ status: false, msg: "provide book subcategory. it's mandatory" })
    }
    let savedata = await bookModel.create(data)
    return res.status(201).send({status:true, data: savedata})
} catch (err) {
    res.status(500).send({status:false, error: err.message})
}
}

const getBookByQuery = async function(req,res) {
    try{
    let queryData = req.query 
    
    let bookDetails = await bookModel.find({isDeleted:false, ...queryData}).select({_id:1, title:1, excerpt:1, userId:1, category:1, releasedAt:1, reviews :1})
    if(bookDetails.length==0) return res.status(404).send({status: true,message: 'No book found with this details'})

    let extraKeys=["userId","category","subcategory"]
    for(field in queryData){
        if(!extraKeys.includes(field)){
            return res.status(400).send({status:false,msg:"this filter is not valid"})
        }
    }

    return res.status(200).send({status: true,
        message: 'Books list',
        data:bookDetails})

    }catch(err){
        return res.status(500).send({status :false ,msg : err.message})
    }


}


const getBooksDetails= async function(req,res){
    try {
        let bookId=req.params.bookId
        let verifyBookId=await bookModel.findById(bookId)
        if(!verifyBookId){
            return res.status(404).send({status:false,msg:"Books not found with this details"})
        }
        const reviews = await reviewModel.find({ bookId: verifyBookId._id, isDeleted: false }).select({
            _id: 1,
            bookId: 1,
            reviewedBy: 1,
            reviewedAt: 1,
            rating: 1,
            review: 1
        })

        const data=verifyBookId.toObject()  
        data["reviewsData"] = reviews

        return res.status(200).send({ status: true, message: "Books List", data: data })
        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
    }
}

//update api
const updatebook = async function (req, res) {
    try {
        let bookId = req.params.bookId
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, msg: "BookId is not valid,please enter valid ID" })
        }
        let book = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, msg: "Book is not found for this ID" })
        }
        if (req.pass.userId !== book.userId.toString()) {
            return res.status(403).send({ status: false, msg: "you are not authorised for this opretion" })
        }
        let data = req.body
        if (data.title) {
            let uniquetitle = await bookModel.findOne({ title: data.title })
            if (uniquetitle) {
                return res.status(400).send({ status: false, msg: "this title is already reserved" })
            }
        }
        if (data.ISBN) {
            let uniqueISBN = await bookModel.findOne({ ISBN: data.ISBN })
            if (uniqueISBN) {
                return res.status(400).send({ status: false, msg: "this ISBN Number is already reserved" })
            }
        }
        if (data.title == "") {
            return res.status(400).send({ status: false, msg: "book title value is empty" })
        }
        if (data.excerpt == "") {
            return res.status(400).send({ status: false, msg: "book excerpt value is empty" })
        }
        if (data.ISBN == "") {
            return res.status(400).send({ status: false, msg: "book ISBN Number field is empty" })
        }
        let updatedbook = await bookModel.findByIdAndUpdate(
            { _id: bookId },
            { $set: { title: data.title, ISBN: data.ISBN, excerpt: data.excerpt, releasedAt: moment(new Date()).format("YYYY-MM-DD") } },
            { new: true })
        return res.status(200).send({status:true, message: 'Success', updatedbook })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

//delete api 
 
const deleteBook= async function(req,res){
    let data=req.params.bookId

    if(!mongoose.Types.ObjectId.isValid(data) ){
        return res.status(400).send({status:false,msg:"BookId is incorrect"})
    }

    let verifyId=await bookModel.findById(data)

    
    if(!verifyId){
        return res.status(404).send({status:false,msg:"books not found "})
    }
    
    if(verifyId.isDeleted===true){
        return res.status(400).send({status:false,msg:"this book is already deleted"})
    }


    if(verifyId.isDeleted===false){
        let deleteDocument=await bookModel.findOneAndUpdate({
            $set:{
                isDeleted:true
            }
            
        })
        return res.status(200).send({status:true,msg:"book is successfully deleted"})
    }
}


module.exports={getBooksDetails,createbook,getBookByQuery,deleteBook,updatebook}