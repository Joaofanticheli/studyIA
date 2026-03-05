const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { chat } = require('../controllers/chatController');

router.use(protect);
router.post('/', chat);

module.exports = router;
