import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateContextType {
    globalSelectedDate: Date;
    setGlobalSelectedDate: (date: Date) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

interface DateProviderProps {
    children: ReactNode;
}

export const DateProvider: React.FC<DateProviderProps> = ({ children }) => {
    const [globalSelectedDate, setGlobalSelectedDate] = useState<Date>(new Date());

    return (
        <DateContext.Provider value={{ globalSelectedDate, setGlobalSelectedDate }}>
            {children}
        </DateContext.Provider>
    );
};

export const useGlobalDate = (): DateContextType => {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useGlobalDate must be used within a DateProvider');
    }
    return context;
};

export default DateContext;
