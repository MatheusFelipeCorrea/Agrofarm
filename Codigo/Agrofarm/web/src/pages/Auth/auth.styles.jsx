import styled from "styled-components";
import tractorBg from "../../assets/img/tractor-working-green-field.jpg";

/* --- Container (fundo "hero" do auth) */

export const Container = styled.div`
  height: 100vh;
  width: 100%;
  background-image: url(${tractorBg});
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

export const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(900px 700px at 20% 25%, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.65));
`;

/* --- Modal / Card */

export const Modal = styled.div`
  position: relative;
  background: #eeeeeee0;
  padding: 44px 44px 36px;
  border-radius: 22px;
  width: min(530px, 94vw);
  z-index: 2;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  align-content: center;

  h2 {
    font-size: 22px;
    margin-bottom: 6px;
  }

  .logo {
    width: 92px;
    height: 92px;
    object-fit: contain;
    margin: 0 auto 14px;
  }

  @media (max-width: 1024px) {
    width: min(600px, 94vw);
    padding: 40px 38px 32px;

    h2 {
      font-size: 21px;
    }
    .logo {
      width: 86px;
      height: 86px;
      margin: 0 auto 12px;
    }
  }

  @media (max-width: 768px) {
    width: min(600px, 94vw);
    padding: 34px 26px 28px;

    h2 {
      font-size: 21px;
    }
    .logo {
      width: 82px;
      height: 82px;
      margin: 0 auto 10px;
    }
  }

  @media (max-width: 480px) {
    width: 95%;
    padding: 30px 18px 24px;
    border-radius: 16px;

    h2 {
      font-size: 19px;
    }

    .logo {
      width: 76px;
      height: 76px;
      margin: 0 auto 10px;
    }
  }
`;

/* --- Input Group */

export const InputGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  padding-bottom: 4px;

  label {
    margin-bottom: 5px;
    font-size: 14px;
    font-weight: 600;
    color: rgba(15, 23, 42, 0.86);

    @media (max-width: 1024px) {
      font-size: 14px;
    }
    @media (max-width: 768px) {
      font-size: 13px;
    }
    @media (max-width: 480px) {
      font-size: 13px;
    }
  }

  input {
    padding: 11px 12px;
    width: 100%;
    border-radius: 12px;
    font-size: 14px;
    border: 1px solid rgba(148, 163, 184, 0.55);
    background: rgba(241, 245, 249, 0.75);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

    &:focus {
      border-color: rgba(34, 197, 94, 0.65);
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.16);
      background: rgba(255, 255, 255, 0.9);
    }

    @media (max-width: 1024px) {
      padding: 11px 12px;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      padding: 10px 11px;
      font-size: 14px;
    }

    @media (max-width: 480px) {
      padding: 10px 11px;
      font-size: 13px;
      border-radius: 12px;
    }
  }

  /* Inputs com icone a esquerda (ex.: Login) */
  input.input-with-left-icon {
    padding-left: 2.75rem;
  }

  /* Alinhamento dos icones dentro dos inputs */
  .relative span {
    top: 50%;
    transform: translateY(-50%);
  }
`;

/* --- Erro */

export const ErrorMessage = styled.p`
  color: red;
  font-size: 14px;
  margin-top: 5px;
`;

/* --- Botao */

export const SubmitButton = styled.button`
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 12px;
  background: #164b2c;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #0f3a22;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 15px;
  }

  @media (max-width: 480px) {
    padding: 10px;
    font-size: 14px;
    border-radius: 8px;
  }
`;

/* --- Links */

export const EsqueciSenhaLink = styled.a`
  display: block;
  text-align: right;
  margin-bottom: 15px;
  color: rgba(15, 23, 42, 0.72);
  text-decoration: none;
  margin-bottom: 14px;
  font-size: 12.5px;

  &:hover {
    text-decoration: underline;
    color: rgba(15, 23, 42, 0.9);
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

export const LinkVoltar = styled.a`
  display: block;
  margin-bottom: 15px;
  color: #444444;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: #000000;
  }
`;
