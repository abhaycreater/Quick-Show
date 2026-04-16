// import React from 'react'
// import { assets } from '../assets/assets'
// import { ArrowRight, CalendarIcon, ClockIcon } from 'lucide-react'
// import { useNavigate } from 'react-router-dom'

// const HeroSection = () => {

//     const navigate = useNavigate()
//   return (
//     <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-[url("/backgroundImage.png")] bg-cover bg-center h-screen'>

//       <img className='max-h-11 lg:h-11 mt-20' src={assets.marvelLogo} alt="" />

//       <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110'>Guardians <br/> of the Galaxy</h1>

//       <div className='flex items-center gap-4 text-gray-300'>
//         <span>Action | Adventure | Sci-Fi</span>
//         <div className='flex items-center gap-1'>
//             <CalendarIcon className='w-4.5 h-4.5'/>2018
//         </div>
//         <div className='flex items-center gap-1'>
//             <ClockIcon className='w-4.5 h-4.5'/> 2h 8m
//         </div>
//       </div>
//       <p className='max-w-md text-gray-300'>In a post-apoclyptic world where cities ride onn wheels and consume each other to survive, two people meet in London and try to stop a conspiracy.</p>
//       <button onClick={()=>navigate('/movies')} className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
//         Explore Movies
//         <ArrowRight className='w-5 h-5'/>
//       </button>
//     </div>
//   )
// }

// export default HeroSection
import React, { useEffect, useState } from "react";
import { assets, dummyShowsData } from "../assets/assets";
import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % dummyShowsData.length);
        setFade(true);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const movie = dummyShowsData[currentSlide];

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background image with better face visibility */}
      <img
        src={movie.poster_path}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover object-top scale-110 transition-all duration-1000"
      />

      {/* dark cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/40"></div>

      {/* Hero content */}
      <div
        className={`relative z-10 flex flex-col items-start justify-center h-full gap-4 px-6 md:px-16 lg:px-36 text-white transition-all duration-700 ${
          fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <img
          className="max-h-11 lg:h-11 mt-20"
          src={assets.marvelLogo}
          alt=""
        />

        <h1 className="text-5xl md:text-[70px] md:leading-[80px] font-bold max-w-3xl">
          {movie.title}
        </h1>

        <div className="flex items-center gap-4 text-gray-300">
          <span>{movie.genre?.join(" | ") || "Action | Adventure"}</span>

          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            {movie.release_date?.slice(0, 4) || "2025"}
          </div>

          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            {movie.runtime || "2h 8m"}
          </div>
        </div>

        <p className="max-w-2xl text-gray-300 text-lg">
          {movie.overview ||
            "Experience the latest blockbuster on the big screen."}
        </p>

        <button
          onClick={() => navigate("/movies")}
          className="flex items-center gap-2 px-6 py-3 mt-4 text-sm font-medium transition bg-red-500 rounded-full hover:bg-red-600"
        >
          Explore Movies
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HeroSection;