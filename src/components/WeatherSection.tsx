import { motion } from 'motion/react';
import { Sun, CloudSun, Sunset, Thermometer, Sparkles, Wind } from 'lucide-react';
import { WeatherData } from '../types';

interface Props {
  weather?: WeatherData;
  isLight?: boolean;
}

export default function WeatherSection({ weather, isLight }: Props) {
  if (!weather || !weather.enabled) return null;

  return (
    <div className="my-10 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`p-4 sm:p-5 rounded-2xl ${
          isLight
            ? 'bg-gradient-to-r from-amber-100/80 via-emerald-50/90 to-amber-50/80 border border-amber-400/50 shadow-md text-stone-900'
            : 'bg-gradient-to-r from-amber-950/40 via-stone-900/60 to-stone-950/80 border border-amber-500/30 shadow-lg text-stone-100'
        } backdrop-blur-md`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Weather summary */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${
              isLight
                ? 'bg-amber-100 border border-amber-400/60 text-amber-700'
                : 'bg-amber-500/10 border border-amber-400/30 text-amber-400'
            } flex items-center justify-center`}>
              <Sun className="w-6 h-6 animate-spin-slow" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-lg sm:text-xl font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                  {weather.temperature}
                </span>
                <span className={`text-xs sm:text-sm font-medium ${isLight ? 'text-emerald-950 font-semibold' : 'text-stone-200'} font-amiri`}>
                  {weather.condition}
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-stone-600' : 'text-stone-400'} font-light mt-0.5`}>
                پیش‌بینی هوای دلپذیر در زمان برگزاری جشن
              </p>
            </div>
          </div>

          {/* Golden Hour photography widget */}
          {weather.goldenHour && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
              isLight
                ? 'bg-amber-100/90 border border-amber-400/50 text-amber-900'
                : 'bg-amber-500/10 border border-amber-400/20 text-amber-300'
            } text-xs`}>
              <Sunset className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
              <div>
                <span className={`block text-[10px] ${isLight ? 'text-stone-700' : 'text-stone-400'} font-medium`}>ساعت طلایی عکاسی باغ:</span>
                <span className={`font-bold ${isLight ? 'text-amber-950 font-black' : 'text-amber-200'} font-mono`}>{weather.goldenHour}</span>
              </div>
            </div>
          )}
        </div>

        {weather.note && (
          <p className={`mt-3 pt-3 border-t ${isLight ? 'border-stone-200 text-stone-700' : 'border-stone-800/80 text-stone-400'} text-xs font-light leading-relaxed`}>
            ✨ {weather.note}
          </p>
        )}
      </motion.div>
    </div>
  );
}
