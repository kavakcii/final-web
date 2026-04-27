"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Asset {
  asset: string;
  percentage: number;
  color: string;
  description: string;
}

interface PortfolioData {
  profileName: string;
  aiAnalysis: string;
  portfolio: Asset[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: PortfolioData;
}

export function PortfolioRecommendationModal({ isOpen, onClose, data }: ModalProps) {
  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99]"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100] pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00008B] to-blue-500 flex items-center justify-center shadow-lg shadow-[#00008B]/20">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">FinAi Portföy Reçetesi</h2>
                    <p className="text-xs font-medium text-slate-500">{data.profileName}</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* AI Analysis Text */}
                <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-6 mb-8 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm">
                    <Brain className="w-3.5 h-3.5 text-[#00008B]" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                    "{data.aiAnalysis}"
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Chart */}
                  <div className="h-[240px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.portfolio}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="percentage"
                          stroke="none"
                        >
                          {data.portfolio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <TrendingUp className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Dağılım</span>
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex flex-col gap-3">
                    {data.portfolio.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group">
                        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: item.color }} />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-bold text-slate-800">{item.asset}</span>
                                <span className="text-sm font-black" style={{ color: item.color }}>%{item.percentage}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
