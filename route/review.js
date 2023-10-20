const { addReview, updateReview, removeReview, getReviewsByMovie } = require('../controller/review');
const { isAuth } = require('../middleware/auth');
const { validateRating, validator } = require('../middleware/validator');

const router = require('express').Router();

router.post('/add/:movieId', isAuth, validateRating, validator, addReview)

router.patch('/:reviewId', isAuth, validateRating, validator, updateReview)

router.delete('/:reviewId', isAuth, removeReview)

router.get('/getreviewbymovie/:movieId', getReviewsByMovie)

module.exports = router