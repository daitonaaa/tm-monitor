import React, {useCallback, useState} from 'react';
import './App.css';
import moment from 'moment';
import * as R from 'ramda';

const parseDateKey = (key) => key.replace(/([\d]+)_([\d]+)_([\d]+)/g, '$2.$1.$3');

const json = require('./data.json');
const jsonParsed = Object.keys(json).map(key => ({
  date: new Date(parseDateKey(key)),
  tasks: json[key].map(d => ({
    ...d,
    timestamp: new Date(d.timestamp),
  }))
}));

jsonParsed.sort((a, b) => +a.date - +b.date);

const addEstimated = (arr) => {
  const results = [];
  arr.forEach(item => {
    const itemRes = [];

    item.tasks.forEach((task, taskIndex) => {
      if (taskIndex === item.tasks.length - 1) {
        return itemRes.push({
          ...task,
          estimated: 0,
        });
      }

      const time = item.tasks[taskIndex + 1].timestamp - +task.timestamp;
      itemRes.push({
        ...task,
        estimated: time / 3.6e+6,
      })
    });

    results.push({
      date: item.date,
      tasks: itemRes,
    })
  });

  return results;
}

const mergeDublicates = (arr) => {

  return arr.map(arrItem => {
    const taskMap = new Map();

    arrItem.tasks.forEach(i => {
      const cur = taskMap.get(i.id);

      if (cur) {
        taskMap.set(i.id, {
          ...cur,
          estimated: cur.estimated += i.estimated,
        });
      } else {
        taskMap.set(i.id, i);
      }
    });

    return {
      ...arrItem,
      tasks: [...taskMap.values()],
    };
  })
};

const fixedEstimated = (arr) =>
  arr.map(i => ({
    ...i,
    tasks: i.tasks.map(elem => ({
      ...elem,
      estimated: elem.estimated.toFixed(1)
    })),
  }))

const addTotals = (arr) =>
  arr.map(i => ({
    ...i,
    totalEstimated: i.tasks.reduce((acc, cur) => acc += cur.estimated, 0).toFixed(1)
  }));

const data = R.compose(fixedEstimated, addTotals, mergeDublicates, addEstimated)(jsonParsed);

const Day = ({ day }) => {
  const [checkList, setChecked] = useState([]);

  const hasInList = useCallback((i) => {
    return checkList.includes(i);
  }, [checkList]);

  const toggle = useCallback((i) => {
    if (hasInList(i)) {
      setChecked(list => list.filter(item => item !== i));
    } else {
      setChecked(list => [...list, i]);
    }
  }, [hasInList, setChecked]);

  return (
    <>
      {
        day.tasks.map((task, i) => {
          const checked = hasInList(i);
          return (
            <div onClick={() => toggle(i)} className={`task ${checked ? 'task--checked' : ''}`} key={task.text}>
              <div className='task__text'>{task.text}</div>
              <div className="task__time">
                {task.estimated}
              </div>
            </div>
          )
        })
      }
    </>
  )
};

const App = () => {
  return (
    <div className="wrap">
      {
        data.map(day => (
          <div className="day" key={day.date.toString()}>
            <h5 className="day-mark">{moment(day.date).format('DD.MM.YYYY')}</h5>
            <div>
              <Day day={day} />
            </div>
            <div className="day__total">
              <span>{day.totalEstimated}</span>
            </div>
          </div>
        ))
      }
    </div>
  );
}

export default App;
