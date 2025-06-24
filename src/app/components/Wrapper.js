// components/Wrapper.js
'use client';
import styled from 'styled-components';

const Wrapper = styled.div`
  max-width: 600px;
  margin: auto;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 24px;
  font-family: 'Times New Roman','sans-serif', cursive;
  transition: background 0.3s, color 0.3s;
`;
export default Wrapper;
