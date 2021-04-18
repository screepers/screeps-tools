import React from 'react';
import ReactDOM from 'react-dom';
import * as Constants from './constants.jsx';

export default class App extends React.Component {
  render() {
    return (
      <div className="container">
        <form>
          <select>
            <option value="shard1">shard1</option>
          </select>
          <input type="text" name="player" placeholder="Player name" />
          <input type="text" name="room" placeholder="Room" />
        </form>
      </div>
    )
  }
}
  
ReactDOM.render(
  <App />,
  document.getElementById('app')
);
    