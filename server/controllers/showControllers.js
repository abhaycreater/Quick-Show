import axios from "axios";
import movieModel from "../models/Movie.js";
import showModel from "../models/Show.js";
import https from 'https'
import { set } from "mongoose";


//api to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}`
    );

    res.json({ success: true, movies: data.results });
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ stable axios instance
const axiosInstance = axios.create({
  timeout: 5000,
  httpsAgent: new https.Agent({
    keepAlive: false,
  }),
});

// ✅ retry helper
const fetchData = async (url, retries = 3) => {
  try {
    return await axiosInstance.get(url);
  } catch (err) {
    if (retries > 0 && err.code === "ECONNRESET") {
      console.log("Retrying request...");
      return fetchData(url, retries - 1);
    }
    throw err;
  }
};

//api to add a new show to the database
export const addShow = async (req, res) => {
  try {
    const { movieId, showInput, showPrice } = req.body;

    let movie = await movieModel.findById(movieId);

    if (!movie) {
      // ✅ safer API calls (no Promise.all)
      const movieDetailsResponse = await fetchData(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`
      );

      const movieCreditsResponse = await fetchData(
        `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.TMDB_API_KEY}`
      );

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast, // ✅ FIXED
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      movie = await movieModel.create(movieDetails);
    }

    const showToCreate = [];

    showInput.forEach((show) => {
      const showDate = show.date;

      show.time.forEach((time) => {
        const dateTimeString = new Date(`${showDate}T${time}:00`);

        showToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {},
        });
      });
    });

    if (showToCreate.length > 0) {
      await showModel.insertMany(showToCreate);
    }

    res.json({ success: true, message: "Show Added Successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//api to get all shows from the database
export const getShows = async (req ,res)=>{
  try{
    const shows = await showModel
  .find()  //{ showDateTime: { $gte: new Date() } }
  .populate('movie')
  .sort({ showDateTime: 1 });

    //filter unique shows
    const uniqueShows = new Set(shows.map(show => show.movie))

    res.json({success: true , shows: Array.from(uniqueShows)})
  }catch(error){
    console.log(error);
    res.json({success: false , message: error.message})
    
  }
}

//api to get a singel show from database 
export const getShow = async (req ,res)=>{
  try{
    const {movieId} = req.params;
    //get all upcoming shows for the movie
    const shows = await showModel.find({movie:movieId ,showDateTime:{$gte: new Date()}})

    const movie = await movieModel.findById(movieId)
    const dateTime = {};

    shows.forEach((show)=>{
      const date = show.showDateTime.toISOString().split("T")[0];
      if(!dateTime[date]){
        dateTime[date]=[]
      }
      dateTime[date].push({time: show.showDateTime,showId:show._id})
    })
    res.json({success: true ,movie ,dateTime})
  }catch(error){
    console.log(error);
    res.json({success:false ,message:error.message})
  }
}