import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const test = async () => {
  try {
    console.log("API KEY:", process.env.TMDB_API_KEY);

    const res = await axios.get(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}`
    );

    console.log(res.data);
  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
  }
};

test();