
import React from "react";
import { assets, dummyShowsData } from "../assets/assets";
import MovieCard from "../components/MovieCard";

const Movies = () => {
  return dummyShowsData.length > 0 ? (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={assets.bgVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Page Content */}
       <div className="relative z-10 px-6 md:px-16 lg:px-40 xl:px-44 pt-28 pb-10">
        <h1 className="mt-12 mb-8 text-4xl font-black uppercase tracking-widest text-red-500 animate-pulse">
  Now Showing
</h1>

  <div className="flex flex-wrap max-sm:justify-center gap-8">
    {dummyShowsData.map((movie) => (
      <MovieCard movie={movie} key={movie._id} />
    ))}
  </div>
</div>
    </div>
  ) : (
    <div>No movies found</div>
  );
};

export default Movies;