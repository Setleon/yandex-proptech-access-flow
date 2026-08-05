import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yandex-proptech-access-flow.obael.chatgpt.site"),
  title: "Разовый пропуск — интерактивный прототип",
  description: "Мобильный прототип разового пропуска: отдельные формы для человека и транспорта, честный статус и передача доступа посетителю.",
  openGraph: {
    title: "Разовый пропуск: от заявки до прохода",
    description: "Точечное изменение текущего приложения: корректный ввод, готовность доступа и инструкция посетителю.",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Разовый пропуск от заявки до прохода" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Разовый пропуск: от заявки до прохода",
    description: "Интерактивный мобильный прототип разового пропуска для жилого объекта.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
