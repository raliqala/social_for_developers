import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line no-unused-vars
import { SET_ALERT, REMOVE_ALERT } from './types';

export const setAlert = (msg, alertType, timeout = 3000) => dispatch => {
  const id = uuidv4();
  dispatch({
    type: SET_ALERT,
    payload: {
      msg,
      alertType,
      id
    }
  });

  setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout)
}