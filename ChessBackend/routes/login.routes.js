const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const router = express.Router();


router.post('/login', async (req, res) => {

    if(req.session.userID) {
        const userId = req.session.userID;
        try {
            const user = await User.getUserbyId(userId);
            return res.status(200).json({message: "Login Successful!", user: {
                name: user.name,
                email: user.email
            }});
        } catch(err) {
            console.error(err);
            return res.status(500).json({message: "Server Error. Try again"});
        }
        
    }
     
    if(!req.body) {
        return res.status(401).json({message: "No token for auto login"});
    }
    const {username, password} = req.body;
    
    try {
        // check for existence of username in db
        const user = await User.getUserByName(username);
        if(!user) {
            return res.status(400).json({message: `No user with username '${username}'`});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch) {
            // setup session
            req.session.userID = user.id;
    
            return res.json({message: "Login Successful!", user: {
                username: user.name,
                email: user.email,
            }});
        }
        
        if(!isMatch) {
            res.statusCode = 401;
            return res.json({message: "Invalid Credentials"});
        }
    
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: err.message, cause: err.cause});
    }

});


router.post('/logout', async (req, res) => {
    req.session.userID = null;
    req.session.destroy((err) => {
        if(err) {
            return res.status(500).json({message: "Logout failed!"});
        } 
        res.clearCookie('connect.sid');
        return res.json({message: "Logout successful!"});
    });
});


module.exports = router;