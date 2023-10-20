const crypto = require('crypto')
const cloudinary = require('../cloud') 
const Review = require('../model/reviewSchema')
// const mongoose = require('mongoose')

exports.helperError = (res, message, statusCode = 401) => {
     res.status(statusCode).json({error: message})
}

exports.generateRandomBytes = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(30, (err, buff) => {
            if (err) reject(err);
            const buffString = buff.toString("hex");
            resolve(buffString);
        });
    });
};

exports.handleNotFound = (req, res) => {
    this.helperError(res, "404 Not Found", 404)
}

exports.uploadImageToCloud = async (file) => {  
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(
        file,
        {gravity: "face", width: 500, height: 500, crop: "thumb"}
    )
    return { url, public_id }
}

exports.formatActor = actor => {
    const { name, gender, about, _id, avatar } = actor
    return {
        id: _id,
        name,
        about,
        gender,
        avatar
    }
}

exports.parseData = (req, res, next) => {

    const { trailer, cast, genres, tags, writers } = req.body

    if (trailer) req.body.trailer = JSON.parse(trailer)
    if (cast) req.body.cast = JSON.parse(cast)
    if (genres) req.body.genres = JSON.parse(genres)
    if (tags) req.body.tags = JSON.parse(tags)
    if (writers) req.body.writers = JSON.parse(writers)

    next()
}

exports.averageRatingPipeline = (movieId) => {
    return [
        {
          $lookup: {
            from: "Review",
            localField: "rating",
            foreignField: "_id",
            as: "avgRating",
          },
        },
        {
          $match: { parentMovie: movieId },
        },
        {
          $group: {
            _id: null,
            ratingAvg: {
              $avg: "$rating",
            },
            reviewCount: {
              $sum: 1,
            },
          },
        },
      ]
}

exports.realtedMovieAggregation = (tags, movieId) => {
  return [
    {
      $lookup: {
        from: 'Movie',
        localField: 'tags',
        foreignField: '_id',
        as: 'relatedMovies',
      }
    },
    {
      $match: {
        tags: {$in: [...tags]},
        _id: {$ne: movieId},
      }
    },
    {
      $project: {
        title: 1,
        poster: '$poster.url',
        responsivePosters: '$poster.responsive'
      }
    },
    {
      $limit: 5
    }
  ]
}

exports.getAverageRatings = async (movieId) => {
   // can't pass directly 'movieId' to aggregation, if you want to pass movieId :
  // mongoose.Types.ObjectId(movieId) --> this will work or else do it like below.

  // const id = mongoose.Types.ObjectId(movieId)

  const [aggregatedResponse] = await Review.aggregate(this.averageRatingPipeline(movieId));
  const reviews = {}
  if (aggregatedResponse) {
    const { ratingAvg, reviewCount } = aggregatedResponse
    reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1),
    reviews.reviewCount = reviewCount
  }

  return reviews
}

exports.topRatedMovieAggregation = (type) => {

  const matchOptions = {
    reviews: {$exists: true},
    status: 'public'
  }

  if (type) matchOptions.type = type

  return [
    {
      $lookup: {
        from: 'Movie',
        localField: 'reviews',
        foreignField: '_id',
        as: 'topRated'
      }
    },
    {
      $match: matchOptions
    },
    {
      $project: {
        title: 1,
        poster: '$poster.url',
        responsivePosters: '$poster.responsive',
        reviewCount: {$size: '$reviews'}
      }
    },
    {
      $sort: {
        reviewCount: -1
      }
    },
    {
      $limit: 5
    }
  ]
}