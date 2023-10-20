const { isValidObjectId } = require("mongoose");
const { helperError, getAverageRatings } = require("../utils/helper");
const Movie = require("../model/movieSchema");
const Review = require("../model/reviewSchema");

exports.addReview = async (req, res) => {
  const { movieId } = req.params;
  const { content, rating } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(movieId)) return helperError(res, "Invalid Movie!");

  if (!req.user.isVerified) return helperError(res, "Please verify your account!")

  const movie = await Movie.findOne({ _id: movieId, status: "public" });
  if (!movie) return helperError(res, "Movie not found!", 404);

  const isAlreadyReviewed = await Review.findOne({
    owner: userId,
    parentMovie: movie._id,
  });
  if (isAlreadyReviewed) return helperError(res, "Reviewed Already!");

  // create and update review :
  const newReview = new Review({
    owner: userId,
    parentMovie: movie._id,
    content,
    rating,
  });

  // updating review of movie :
  movie.reviews.push(newReview._id);
  await movie.save();

  // saving new rating :
  await newReview.save();

  const reviews = await getAverageRatings(movie._id)

  res.json({ message: "Review added.", reviews });
};

exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { content, rating } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(reviewId)) return helperError(res, "Invalid Review!");

  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review) return helperError(res, "Review not found!", 404);

  review.content = content;
  review.rating = rating;

  await review.save();

  res.json({ message: "Your review has been updated." });
};

exports.removeReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(reviewId)) return helperError(res, "Invalid Review!");

  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review) return helperError(res, "Invalid request, review not found!");

  const movie = await Movie.findById(review.parentMovie).select("reviews");
  movie.reviews = movie.reviews.filter((rId) => rId.toString() !== reviewId);

  await Review.findByIdAndDelete(reviewId);

  await movie.save();

  res.json({ message: "Review deleted successfully." });
};

exports.getReviewsByMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return helperError(res, "Invalid Movie!");

  const movie = await Movie.findById(movieId).populate({
    path: "reviews",
    populate: {
        path: 'owner',
        select: 'name'
    },
  }).select("reviews");

  const movieName = await Movie.findById(movieId)

  const reviews = movie.reviews.map((r) => {
    const { owner, content, rating, _id: reviewId } = r;
    const { name, _id: ownerId} = owner

    return {
        reviewId,
        owner: {
            ownerId, name
        },
        content, rating
    };

  })

  res.json({ reviews, movieName: movieName.title })
  
};
