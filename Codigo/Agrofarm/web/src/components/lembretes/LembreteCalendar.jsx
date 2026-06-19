import "./calendar.css";

export default function LembreteCalendar({
  calendario,
  selectedDate,
  onSelectDate,
  currentDate,
  setCurrentDate,
}) {

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const dias = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    dias.push({
      day: prevMonthDays - i,
      current: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    dias.push({
      day: i,
      current: true,
    });
  }

  while (dias.length < 42) {
    dias.push({
      day: dias.length - daysInMonth - firstDay + 1,
      current: false,
    });
  }

  const handlePrev = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="lembrete-calendar">
      <div className="lembrete-calendar-header">
        <h3>{monthName}</h3>

        <div className="lembrete-nav">
          <button onClick={handlePrev}>‹</button>
          <button onClick={handleNext}>›</button>
        </div>
      </div>

      <div className="lembrete-weekdays">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="lembrete-calendar-grid">
        {dias.map((d, index) => {
          const day = String(d.day).padStart(2, "0");

          let displayMonth = month;
          let displayYear = year;

          if (!d.current && d.day > 20) {
            displayMonth = month - 1;

            if (displayMonth < 0) {
              displayMonth = 11;
              displayYear -= 1;
            }
          }

          if (!d.current && d.day < 15) {
            displayMonth = month + 1;

            if (displayMonth > 11) {
              displayMonth = 0;
              displayYear += 1;
            }
          }

          const monthStr = String(displayMonth + 1).padStart(2, "0");

          const dataKey = `${displayYear}-${monthStr}-${day}`;
          const dayData = calendario?.[dataKey];

          //console.log(calendario);
          const isSelected = selectedDate === dataKey;
          //console.log(dataKey, calendario?.[dataKey]);

          const hoje = new Date();
          const hojeKey = `${hoje.getFullYear()}-${String(
            hoje.getMonth() + 1
          ).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

          const isToday = dataKey === hojeKey;

          return (
            <div
              key={index}
              className={`lembrete-day 
                ${d.current ? "" : "disabled"} 
                ${isSelected ? "selected" : ""}
                ${isToday ? "today" : ""}
              `}
              onClick={() => d.current && onSelectDate(dataKey)}
            >
              <span className="lembrete-day-number">{d.day}</span>

              <div className="lembrete-dots">
                {dayData?.ATRASADO > 0 && (
                  <span className="lembrete-dot red" />
                )}
                {dayData?.PENDENTE > 0 && (
                  <span className="lembrete-dot yellow" />
                )}
                {dayData?.ENVIADO > 0 && (
                  <span className="lembrete-dot green" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="lembrete-legend">
        <span><span className="lembrete-dot yellow" /> Pendentes</span>
        <span><span className="lembrete-dot red" /> Atrasados</span>
        <span><span className="lembrete-dot green" /> Concluídos</span>
      </div>
    </div>
  );
}