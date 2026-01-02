import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

export default function TestPicker() {
  return (
    <DateTimePicker
      mode="single"
      date={dayjs()}
      onChange={() => {}}
      selectedItemColor="red"
      selectedColor="red"
      primaryColor="red"
      mainColor="red"
      tintColor="red"
      headerTextStyle={{ color: 'red' }}
      calendarTextStyle={{ color: 'red' }}
      selectedTextStyle={{ color: 'red' }}
      weekDaysTextStyle={{ color: 'red' }}
      todayTextStyle={{ color: 'red' }}
      headerButtonColor="red"
    />
  );
}
