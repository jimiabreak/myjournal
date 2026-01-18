'use client';

export function Calendar() {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="lj-calendar">
      <div className="lj-calendar-header">
        {monthName} {year}
      </div>
      <div className="lj-calendar-nav">
        <a href="#" onClick={handleClick}>« Prev</a>
        <a href="#" onClick={handleClick}>Next »</a>
      </div>
      <div className="text-tiny" style={{ color: 'var(--lj-gray)' }}>
        (Calendar view coming soon)
      </div>
    </div>
  );
}

export function DayNavigation() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="lj-day-nav">
      <a href="#" onClick={handleClick}>« Previous Day</a>
      <span style={{ margin: '0 8px', color: 'var(--lj-gray)' }}>|</span>
      <a href="#" onClick={handleClick}>Next Day »</a>
    </div>
  );
}