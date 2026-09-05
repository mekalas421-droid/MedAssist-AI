"use client";

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import AnimatedButton from "./AnimatedButton";

export default function EmptyState({ 
  icon: Icon = FolderOpen, 
  title = "No data available", 
  description = "There are no records to display at this time.",
  actionLabel,
  onAction
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/10 backdrop-blur-sm"
    >
      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 font-medium max-w-sm mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <AnimatedButton onClick={onAction}>
          {actionLabel}
        </AnimatedButton>
      )}
    </motion.div>
  );
}
