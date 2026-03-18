/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

// --- Utility Functions ---

// Greatest Common Divisor
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// Simplify a fraction
const simplify = (num: number, den: number): [number, number] => {
  const common = gcd(Math.abs(num), Math.abs(den));
  return [num / common, den / common];
};

interface Fraction {
  num: number;
  den: number;
}

const formatFraction = (f: Fraction) => {
  if (f.den === 1) return `${f.num}`;
  return `${f.num}/${f.den}`;
};

// --- Problem Generation ---

type Operation = '+' | '-' | '*' | '/';

interface Problem {
  f1: Fraction;
  f2: Fraction;
  op: Operation;
  answer: Fraction;
  options: string[];
}

const generateProblem = (): Problem => {
  const ops: Operation[] = ['+', '-', '*', '/'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let f1: Fraction = { num: Math.floor(Math.random() * 5) + 1, den: Math.floor(Math.random() * 5) + 2 };
  let f2: Fraction = { num: Math.floor(Math.random() * 5) + 1, den: Math.floor(Math.random() * 5) + 2 };

  // Simplify inputs to make them look "cleaner"
  [f1.num, f1.den] = simplify(f1.num, f1.den);
  [f2.num, f2.den] = simplify(f2.num, f2.den);

  let ansNum = 0;
  let ansDen = 1;

  switch (op) {
    case '+':
      ansNum = f1.num * f2.den + f2.num * f1.den;
      ansDen = f1.den * f2.den;
      break;
    case '-':
      // Ensure positive result for kids
      if (f1.num * f2.den < f2.num * f1.den) {
        [f1, f2] = [f2, f1];
      }
      ansNum = f1.num * f2.den - f2.num * f1.den;
      ansDen = f1.den * f2.den;
      break;
    case '*':
      ansNum = f1.num * f2.num;
      ansDen = f1.den * f2.den;
      break;
    case '/':
      ansNum = f1.num * f2.den;
      ansDen = f1.den * f2.num;
      break;
  }

  const [finalNum, finalDen] = simplify(ansNum, ansDen);
  const answer: Fraction = { num: finalNum, den: finalDen };
  const answerStr = formatFraction(answer);

  // Generate distractors
  const optionsSet = new Set<string>([answerStr]);
  while (optionsSet.size < 4) {
    const offsetNum = Math.floor(Math.random() * 5) - 2;
    const offsetDen = Math.floor(Math.random() * 3) + 1;
    const dNum = Math.max(1, finalNum + offsetNum);
    const dDen = Math.max(1, finalDen + (offsetNum === 0 ? offsetDen : 0));
    const [sNum, sDen] = simplify(dNum, dDen);
    optionsSet.add(formatFraction({ num: sNum, den: sDen }));
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  return { f1, f2, op, answer, options };
};

// --- Components ---

export default function App() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const nextQuestion = useCallback(() => {
    setProblem(generateProblem());
    setFeedback(null);
  }, []);

  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handleAnswer = (choice: string) => {
    if (!problem) return;

    if (choice === formatFraction(problem.answer)) {
      setFeedback('correct');
      setScore(s => s + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA']
      });
      
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    } else {
      setFeedback('wrong');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  if (!problem) return null;

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans text-[#5D5D5D] flex flex-row items-center justify-center p-4 overflow-hidden">
      {/* Background Shapes for cuteness */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#FFB7B2] opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#B5EAD7] opacity-20 rounded-full blur-3xl" />

      <main className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-sm rounded-[40px] shadow-xl border-8 border-white p-8 flex flex-col items-center">
        
        {/* Header / Score */}
        <div className="w-full flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 bg-[#E2F0CB] px-4 py-2 rounded-full">
            <Trophy className="w-5 h-5 text-[#88B04B]" />
            <span className="font-bold text-[#88B04B]">{score}</span>
          </div>
          <button 
            onClick={() => { setScore(0); nextQuestion(); }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Question Box */}
        <motion.div 
          animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full aspect-video bg-[#F0F7FA] rounded-[30px] border-4 border-[#C7CEEA] flex items-center justify-center mb-10 relative overflow-hidden"
        >
          <div className="text-4xl md:text-5xl font-bold flex items-center gap-4">
            <FractionDisplay f={problem.f1} />
            <span className="text-[#FFB7B2]">{problem.op === '*' ? '×' : problem.op === '/' ? '÷' : problem.op}</span>
            <FractionDisplay f={problem.f2} />
            <span className="text-gray-300">= ?</span>
          </div>

          {/* Feedback Overlay */}
          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#B5EAD7]/90 flex flex-col items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-16 h-16 text-white" />
                <span className="text-2xl font-bold text-white">太棒了！</span>
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#FFB7B2]/90 flex flex-col items-center justify-center gap-2"
              >
                <XCircle className="w-16 h-16 text-white" />
                <span className="text-2xl font-bold text-white">再试一次哦</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {problem.options.map((opt, idx) => (
            <motion.button
              key={opt + idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(opt)}
              disabled={feedback === 'correct'}
              className={`
                h-20 rounded-[24px] text-2xl font-bold transition-all shadow-md
                ${idx === 0 ? 'bg-[#FFB7B2] hover:bg-[#FFA49E] text-white' : ''}
                ${idx === 1 ? 'bg-[#FFDAC1] hover:bg-[#FFC9A3] text-white' : ''}
                ${idx === 2 ? 'bg-[#E2F0CB] hover:bg-[#D4E8B5] text-white' : ''}
                ${idx === 3 ? 'bg-[#C7CEEA] hover:bg-[#B5BEE0] text-white' : ''}
              `}
            >
              {opt.includes('/') ? (
                <div className="flex flex-col items-center scale-75">
                  <span>{opt.split('/')[0]}</span>
                  <div className="w-8 h-1 bg-white my-1 rounded-full" />
                  <span>{opt.split('/')[1]}</span>
                </div>
              ) : opt}
            </motion.button>
          ))}
        </div>

        <p className="mt-8 text-sm text-gray-400 font-medium">
          加油！你是最棒的小数学家 🌟
        </p>
      </main>
    </div>
  );
}

function FractionDisplay({ f }: { f: Fraction }) {
  if (f.den === 1) return <span>{f.num}</span>;
  return (
    <div className="flex flex-col items-center text-3xl">
      <span>{f.num}</span>
      <div className="w-full h-1 bg-[#5D5D5D] my-1 rounded-full" />
      <span>{f.den}</span>
    </div>
  );
}
