import React from "react";
import { assets } from "../assets/assets";
import MovieCard from "../components/MovieCard";
import { useAppContext } from "../context/AppContext";

const Favorite = () => {
  const {favoritesMovies} = useAppContext()
  const totalMovies = favoritesMovies.length;
  const genres = new Set(
  favoritesMovies.flatMap((movie) =>
    movie.genres?.map((genre) => genre.id) || []
  )
).size;

  return totalMovies > 0 ? (
    <div className="relative min-h-screen overflow-hidden">
      {/* 1) Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={assets.favoriteBg} type="video/mp4" />
      </video>

      {/* 2) Dark cinematic overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* 3) Main content */}
      <div className="relative z-10 px-6 md:px-16 lg:px-40 xl:px-44 pt-28 pb-10">
        {/* 4) Unique title */}
        <h1 className="mt-12 mb-4 text-4xl font-black uppercase tracking-[0.2em] text-red-500 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
          🎞️ Your Cinema Vault
        </h1>

        {/* 5) Stats row */}
        <p className="mb-8 text-gray-300 text-lg">
          🍿 {totalMovies} Saved Movies • 🎭 {genres} Genres • ❤️ Watchlist
        </p>

        {/* 6) Genre chips */}
        {/* <div className="flex flex-wrap gap-3 mb-8">
  {genres.slice(0, 6).map((genre) => (
    <span key={genre.id}>{genre.name}</span>
  ))}
</div> */}

        {/* 7) Favorites grid */}
        <div className="flex flex-wrap max-sm:justify-center gap-8">
          {favoritesMovies.map((movie) => (
            <div key={movie._id} className="relative group">
              <MovieCard movie={movie} />

              {/* 8) Remove button UI */}
              <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-red-500/90 px-3 py-1 rounded-full text-xs font-semibold">
                ❤️ Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      {/* 9) Empty state */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">💔 No favorites yet</h2>
        <p className="text-gray-400">Start adding movies you love 🍿</p>
      </div>
    </div>
  );
};

export default Favorite;
