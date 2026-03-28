const state = {
  running: false,
  speed: 1,
  intervalId: null,
};

function getState() {
  return { ...state };
}

function setState(updates) {
  Object.assign(state, updates);
}

module.exports = { getState, setState };
