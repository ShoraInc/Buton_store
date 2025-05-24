import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">BUTON</h2>
            <p className="text-gray-400 text-sm">
              Лучшие цветы в городе Семей. Мы создаем красоту и дарим радость.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Каталог</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Букеты</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Композиции</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Комнатные растения</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Подарки</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Информация</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Доставка</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Оплата</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Контакты</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>г. Семей, К.Мухамеджанова 34</p>
              <p>+7 (XXX) XXX-XX-XX</p>
              <p>info@buton.kz</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">© 2025 BUTON. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;