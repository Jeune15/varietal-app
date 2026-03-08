import React from 'react';
import { ChevronLeft } from 'lucide-react';
import CalendarView from './CalendarView';

interface Props {
  onExit: () => void;
}

const CalendarPage: React.FC<Props> = ({ onExit }) => {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <CalendarView onBack={onExit} />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
