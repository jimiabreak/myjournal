'use client';

export function Calendar() {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long' }).toLowerCase();
  const year = currentDate.getFullYear();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="lj-calendar">
      <div className="lj-calendar-header">
        <span className="lj-star-burst" style={{ fontSize: '10px', marginRight: '4px' }}>✧</span>
        {monthName} {year}
      </div>
      <div className="lj-calendar-nav">
        <a href="#" onClick={handleClick}>« prev</a>
        <span style={{ color: 'var(--lj-text-muted)' }}>|</span>
        <a href="#" onClick={handleClick}>next »</a>
      </div>
      <div
        className="text-tiny text-center"
        style={{
          color: 'var(--lj-text-muted)',
          padding: '8px',
          fontStyle: 'italic'
        }}
      >
        calendar coming soon~
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
      <a href="#" onClick={handleClick}>« earlier</a>
      <span style={{ margin: '0 8px', color: 'var(--lj-text-muted)' }}>|</span>
      <a href="#" onClick={handleClick}>later »</a>
    </div>
  );
}
