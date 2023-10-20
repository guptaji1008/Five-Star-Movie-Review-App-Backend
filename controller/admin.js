const Movie = require("../model/movieSchema");
const Review = require("../model/reviewSchema");
const User = require("../model/userSchema");
const {
  topRatedMovieAggregation,
  getAverageRatings,
} = require("../utils/helper");

exports.getAppInfo = async (req, res) => {
  const movieCount = await Movie.countDocuments();
  const reviewCount = await Review.countDocuments();
  const userCount = await User.countDocuments();

  res.json({ appInfo: { movieCount, reviewCount, userCount } });
};

exports.getMostRated = async (req, res) => {
  const movie = await Movie.aggregate(topRatedMovieAggregation());
  const reviews = await getAverageRatings(movie[0]._id);
  res.json({
    movie: {
      id: movie[0]._id,
      title: movie[0].title,
      reviews: { ...reviews },
    },
  });
};
