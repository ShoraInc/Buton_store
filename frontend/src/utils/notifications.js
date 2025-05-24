export const showNotification = (message, type = 'success') => {
  // Можно использовать библиотеку типа react-toastify
  // Или создать свою систему уведомлений
  
  if (type === 'success') {
    console.log('✅', message);
  } else if (type === 'error') {
    console.error('❌', message);
  } else {
    console.log('ℹ️', message);
  }
  
  // Временно используем alert
  alert(message);
};