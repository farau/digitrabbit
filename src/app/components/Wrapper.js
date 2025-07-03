// app/components/Wrapper.js
'use client';
import styled from 'styled-components';
import { Chakra_Petch } from 'next/font/google';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const Wrapper = styled.div.attrs(() => ({
  className: chakraPetch.className,
}))`
  position: relative;
  margin: auto;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: background 0.3s, color 0.3s;
  overflow: hidden;
  overflow-y: auto;
`;

export default Wrapper;
