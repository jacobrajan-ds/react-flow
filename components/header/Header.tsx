"use client";
import React, { useState, useEffect } from "react";

import Image from "next/image";
import Logo from "../../public/logo.png";
import ExpandableSearch from "@/components/shared/ExpandableSearch";
import Link from "next/link";
// import { FETCH_PROFILE } from "@/app/config/api-url";
import axiosInstance from "@/utils/axios";
import NavBar from "../NavBar/NavBar";

interface HeaderPropsType {
  layoutType: string;
}

interface User {
  firstName: string;
  lastName: string;
}

const Header = ({ layoutType }: HeaderPropsType) => {
  const [isSticky, setIsSticky] = useState(false);
  const [user, setUser] = useState<User | undefined>();
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    // fetchUser();

    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // const fetchUser = async () => {
  //   try {
  //     const response = await axiosInstance.get(FETCH_PROFILE);
  //     if (
  //       response?.data &&
  //       Object.keys(response.data).length > 0 &&
  //       response.data.id
  //     ) {
  //       const userProfileId = response.data.id;
  //       setUserProfileId(userProfileId);
  //       setUser(response.data);
  //     } else {
  //       console.log("No valid user data received");
  //       setUserProfileId(null);
  //       setUser(undefined);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching user:", error);
  //     setUserProfileId(null);
  //     setUser(undefined);
  //   }
  // };

  return (
    <>
      <header
        className={`sticky top-0 z-[5] transition-all duration-200
          ${isSticky ? "bg-[#131B2F] fixed w-full" : "bg-[#131B2F]"}
        `}
      >
        <div className="flex p-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="cursor-pointer flex gap-2">
              <Image src={Logo} alt="" className="size-10" />
              <div className="flex-col justify-items-end">
                <h1 className="text-lg font-bold inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#149A39] to-[#F6B935]">
                  SOAR
                </h1>
                <p className="text-[10px] text-[#F6B935] mt-[-8px]">Alpha</p>
              </div>
            </Link>

            <span className="w-[0.5px] h-8 bg-white mx-5"></span>

            {/* <div className="flex items-center gap-4 border-l px-8 mx-8">
              <p className="text-md font-semibold text-white">Tenant</p>
              <div></div>
            </div> */}
          </div>

          {/* <div className="flex gap-0 items-center">
            <div className="flex items-center">
              <ExpandableSearch />
            </div>
          </div> */}
        </div>
        <NavBar />
      </header>
    </>
  );
};

export default Header;
