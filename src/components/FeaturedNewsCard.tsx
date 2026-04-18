"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface FeaturedNewsCardProps {
  title: string;
  href: string;
}

export function FeaturedNewsCard({ title, href }: FeaturedNewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="relative w-full max-w-[380px] aspect-[3] rounded-[20px] bg-gradient-to-br from-[#001a4d] via-[#00008B] to-[#001a4d] shadow-2xl cursor-pointer overflow-hidden"
    >
      <Link href={href} className="absolute inset-0 flex items-center justify-center p-6 text-white text-xl font-bold text-center">
        {title}
      </Link>
    </motion.div>
  );
}
