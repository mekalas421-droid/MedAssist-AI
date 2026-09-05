"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions 
}) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-2">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-blue-400 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-300">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-slate-600" />}
              </div>
            ))}
          </div>
        )}
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">{title}</h1>
        {subtitle && <p className="text-slate-400 font-medium">{subtitle}</p>}
      </motion.div>

      {actions && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3 shrink-0"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}
