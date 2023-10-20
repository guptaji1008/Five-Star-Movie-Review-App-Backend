const cloudinary = require("../cloud");
const {
  helperError,
  formatActor,
  averageRatingPipeline,
  realtedMovieAggregation,
  getAverageRatings,
  topRatedMovieAggregation,
} = require("../utils/helper");
const Movie = require("../model/movieSchema");
const Review = require("../model/reviewSchema");
const { isValidObjectId } = require("mongoose");
const mongoose = require("mongoose");

exports.uploadTrailer = async (req, res) => {
  const { file } = req;
  if (!file) return helperError(res, "Video file is missing");

  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file.path,
    {
      resource_type: "video",
    }
  );
  res.json({ url, public_id });
};

exports.createMovie = async (req, res) => {
  const { file, body } = req;

  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = body;

  const newMovie = new Movie({
    title,
    storyLine,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    trailer,
    language,
  });

  if (director) {
    if (!isValidObjectId(director))
      return helperError(res, "Invalid director Id");
    newMovie.director = director;
  }

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return helperError(res, "Invalid writer Id");
    }

    newMovie.writers = writers;
  }

  // uploading poster :
  if (file) {
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(file.path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });

    const finalPoster = { url, public_id, responsive: [] };

    const { breakpoints } = responsive_breakpoints[0];
    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }
    newMovie.poster = finalPoster;
  }

  await newMovie.save();

  res.status(201).json({
    movie: {
      id: newMovie._id,
      title,
    },
  });
};

exports.updateMovieWithoutPoster = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return helperError(res, "Invalid movie Id");

  const movie = await Movie.findById(movieId);
  if (!movie) return helperError(res, "Movie not found", 404);

  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.tags = tags;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;

  if (director) {
    if (!isValidObjectId(director))
      return helperError(res, "Invalid director Id");
    movie.director = director;
  }

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return helperError(res, "Invalid writer Id");
    }

    movie.writers = writers;
  }

  await movie.save();

  res.json({ message: "Movie is updated", movie });
};

exports.updateMovie = async (req, res) => {
  const { movieId } = req.params;
  const { file } = req;

  if (!isValidObjectId(movieId)) return helperError(res, "Invalid movie Id");

  const movie = await Movie.findById(movieId);
  if (!movie) return helperError(res, "Movie not found", 404);

  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.tags = tags;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.cast = cast;
  movie.language = language;

  if (director) {
    if (!isValidObjectId(director))
      return helperError(res, "Invalid director Id");
    movie.director = director;
  }

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return helperError(res, "Invalid writer Id");
    }

    movie.writers = writers;
  }

  // update poster

  if (file) {
    // removing poster from cloud if there is any.

    const posterId = movie.poster?.public_id;

    if (posterId) {
      const { result } = await cloudinary.uploader.destroy(posterId);
      if (result !== "ok") {
        return helperError(res, "Could not update poster at the moment!");
      }
    }

    // uploading poster :
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(req.file.path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });

    const finalPoster = { url, public_id, responsive: [] };

    const { breakpoints } = responsive_breakpoints[0];
    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }

    movie.poster = finalPoster;
  }
  await movie.save();

  res.json({
    message: "Movie is updated",
    movie: {
      id: movie._id,
      title: movie.title,
      poster: movie?.poster.url,
      genres: movie.genres,
      status: movie.status,
    },
  });
};

exports.removeMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return helperError(res, "Invalid movie Id");

  const movie = await Movie.findById(movieId);
  if (!movie) return helperError(res, "Movie not found!", 404);

  // check if there is any poster or not
  // if yes then we need to remove that.

  const posterId = movie.poster?.public_id;
  if (posterId) {
    const { result } = await cloudinary.uploader.destroy(posterId);
    if (result !== "ok") {
      return helperError(res, "Could not remove poster from cloud!");
    }
  }

  // removing trailer
  const trailerId = movie.trailer?.public_id;

  if (!trailerId)
    return helperError(res, "Could not find trailer in the cloud!");

  const { result } = await cloudinary.uploader.destroy(trailerId, {
    resource_type: "video",
  });
  if (result !== "ok")
    return helperError(res, "Could not remove trailer from cloud");

  await Movie.findByIdAndDelete(movieId);

  res.json({ message: "Movie removed successfully!" });
};

exports.getMovies = async (req, res) => {
  const { pageNo, limit } = req.query;

  const movies = await Movie.find()
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  const results = movies.map((movie) => {
    return {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      responsivePosters: movie.poster?.responsive,
      genres: movie.genres,
      status: movie.status,
    };
  });

  res.json({ movies: results });
};

exports.getMovieForUpdate = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return helperError(res, "Invalid request!");

  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  res.json({
    forUpdateMovie: {
      id: movie._id,
      title: movie.title,
      storyLine: movie.storyLine,
      poster: movie?.poster,
      releaseDate: movie.releaseDate,
      status: movie.status,
      type: movie.type,
      language: movie.language,
      genres: movie.genres,
      tags: movie.tags,
      director: formatActor(movie.director),
      writers: movie.writers.map((w) => formatActor(w)),
      cast: movie.cast.map((m) => ({
        id: m.id,
        profile: formatActor(m.actor),
        roleAs: m.roleAs,
        leadActor: m.leadActor,
      })),
    },
  });
};

exports.searchMovie = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return helperError(res, "Invalid request!");

  const movies = await Movie.find({ title: { $regex: title, $options: "i" } });

  res.json({
    results: movies.map((movie) => {
      return {
        id: movie._id,
        title: movie.title,
        poster: movie.poster?.url,
        genres: movie.genres,
        status: movie.status,
      };
    }),
  });
};

exports.getLatestUploads = async (req, res) => {
  const { limit = 5 } = req.query;

  const results = await Movie.find({ status: "public" })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  const movies = results.map((m) => {
    return {
      id: m._id,
      title: m.title,
      storyLine: m.storyLine,
      poster: m.poster?.url,
      responsivePosters: m.poster.responsive,
      trailer: m.trailer?.url,
    };
  });

  res.json({ movies });
};

exports.getSingleMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return helperError(res, "Invalid Movie ID!");

  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  const newMovieId = new mongoose.Types.ObjectId(movieId);

  const reviews = await getAverageRatings(newMovieId);

  const {
    _id: id,
    title,
    storyLine,
    cast,
    writers,
    director,
    releaseDate,
    genres,
    tags,
    language,
    poster,
    trailer,
    type,
  } = movie;

  res.json({
    movie: {
      id,
      title,
      storyLine,
      releaseDate,
      genres,
      tags,
      language,
      type,
      cast: cast.map((c) => ({
        id: c._id,
        profile: {
          id: c.actor._id,
          name: c.actor.name,
          avatar: c.actor?.avatar?.url,
        },
        leadActor: c.leadActor,
        roleAs: c.roleAs,
      })),
      writers: writers.map((w) => ({
        id: w._id,
        name: w.name,
      })),
      director: {
        id: director._id,
        name: director.name,
      },
      poster: poster?.url,
      trailer: trailer?.url,
      reviews: { ...reviews },
    },
  });
};

exports.getRelatedMovies = async (req, res) => {
  const { movieId } = req.params;
  if (!isValidObjectId(movieId)) return helperError(res, "Invalid movie Id");

  const movie = await Movie.findById(movieId);

  const movies = await Movie.aggregate(
    realtedMovieAggregation(movie.tags, movie._id)
  );

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };

  const relatedMovies = await Promise.all(movies.map(mapMovies));

  res.json({ relatedMovies });
};

exports.getTopRatedMovies = async (req, res) => {
  const { type = "Film" } = req.query;

  const movies = await Movie.aggregate(topRatedMovieAggregation(type));

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };

  const topRatedMovies = await Promise.all(movies.map(mapMovies));

  res.json({ topRatedMovies });
};

exports.searchPublicMovie = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return helperError(res, "Invalid request!");

  const movies = await Movie.find({
    title: { $regex: title, $options: "i" },
    status: "public",
  });

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster?.url,
      responsivePosters: m.poster?.responsive,
      reviews: { ...reviews },
    };
  };

  const results = await Promise.all(movies.map(mapMovies));

  res.json({results})

};
