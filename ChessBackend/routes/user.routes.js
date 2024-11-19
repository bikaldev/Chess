const express = require('express');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const Player = require('../models/player.model');

const router = express.Router();


router.post('/createUser', async (req, res) => {
    const { username, email, password } = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({message: "Cannot create user. Missing Data."});
    }

    // eslint-disable-next-line
    const hashedPassword = bcrypt.hashSync(password, +process.env.HASH_SALT);

    const user = new User({
        name: username,
        email,
        password: hashedPassword
    });

    try {
        await user.createUser();
    } catch(err) {
        if(err.cause === "duplicate") {
            return res.status(400).json({
                message: err.message,
                cause: err.cause,
            });
        }

        return res.status(500).json({message: "Failed to create user! ", cause: err.cause});
    }

    res.status(200).json({message: "Created user successfully!"});
})

router.get('/getHistory', async (req, res) => {
    if(!req.session.userID) return res.status(401);
    try {
        const userId = req.session.userID;
        const user = await User.getUserbyId(userId);
        const playerId = await user.getPlayerId();

        const player = new Player(user.name, '*', playerId);
        const matchHistory = await player.getMatchHistory();

        return res.status(200).json({message: 'Successfully Retrieved Match Records.', history: matchHistory.map(
            match => {
                return {
                    ...match,
                    playerName: user.name,
                }
            }
        )});
    } catch(err) {
        console.log(err);
        res.status(500);
    }
    
});

module.exports = router;