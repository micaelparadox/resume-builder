"use client";

import React, { useState, useRef, useEffect } from 'react';
import { generatePDF } from '../api/resumeApi';
import InputMask from 'react-input-mask';
import { FaPlus, FaEdit, FaTrashAlt, FaSave } from 'react-icons/fa';
import styled from 'styled-components';

const initialResume = {
  name: '',
  telephone: '',
  location: '',
  email: '',
  linkedin: '',
  summary: '',
  workHistory: [{ title: '', company: '', startDate: '', endDate: '', duration: '', description: [''], technologies: [''] }],
  education: [{ degree: '', institution: '', startDate: '', endDate: '' }]
};

const Container = styled.div`
  background: #1d1d1d;
  color: #f5f5f5;
  padding: 3rem;
  border-radius: 12px;
  width: 80%;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  color: #f5f5f5;
  font-size: 2.5rem;
`;

const FormSection = styled.div`
  margin-bottom: 2.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  font-weight: bold;
  color: #f5f5f5;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #555;
  background: #333;
  color: #f5f5f5;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #555;
  background: #333;
  color: #f5f5f5;
  font-size: 1rem;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
  margin-right: 0.75rem;
  margin-top: 1rem;
  color: #f5f5f5;
  font-size: 1rem;

  &.add {
    background: #007bff;
  }

  &.edit {
    background: #ffc107;
  }

  &.remove {
    background: #dc3545;
  }

  &:hover {
    opacity: 0.9;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const Error = styled.span`
  display: block;
  margin-top: 0.5rem;
  color: #ff6b6b;
  font-size: 0.875rem;
`;

function Form() {
  const [resume, setResume] = useState(initialResume);
  const [isFormValid, setIsFormValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState({ section: null, index: null });
  const educationRef = useRef(null);

  useEffect(() => {
    validateForm(resume);
  }, [resume]);

  const handleChange = (e, section, index, field) => {
    const updatedResume = { ...resume };
    if (section) {
      if (field === 'description' || field === 'technologies') {
        updatedResume[section][index][field] = e.target.value.split('\n');
      } else {
        updatedResume[section][index][field] = e.target.value;
      }
      if (field === 'startDate' || field === 'endDate') {
        const startDate = updatedResume[section][index].startDate;
        const endDate = updatedResume[section][index].endDate;
        if (startDate && endDate) {
          updatedResume[section][index].duration = calculateDuration(startDate, endDate);
        }
      }
    } else {
      updatedResume[e.target.name] = e.target.value;
    }
    setResume(updatedResume);
  };

  const handleAdd = (section) => {
    const updatedResume = { ...resume };
    if (section === 'workHistory') {
      updatedResume[section].push({ title: '', company: '', startDate: '', endDate: '', duration: '', description: [''], technologies: [''] });
    } else {
      updatedResume[section].push({ degree: '', institution: '', startDate: '', endDate: '' });
    }
    setResume(updatedResume);
    if (section === 'workHistory') {
      setTimeout(() => {
        educationRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  const handleEdit = (section, index) => {
    setIsEditing({ section, index });
  };

  const handleDelete = (section, index) => {
    const updatedResume = { ...resume };
    updatedResume[section].splice(index, 1);
    setResume(updatedResume);
    validateForm(updatedResume);
  };

  const validateForm = (form) => {
    const newErrors = {};
    const requiredFields = ['name', 'telephone', 'location', 'email', 'linkedin', 'summary'];
    requiredFields.forEach(field => {
      if (!form[field]) {
        newErrors[field] = 'Este campo é obrigatório';
      }
    });

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido';
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    form.workHistory.forEach((job, index) => {
      if (!job.title) newErrors[`workHistory-title-${index}`] = 'Título é obrigatório';
      if (!job.company) newErrors[`workHistory-company-${index}`] = 'Empresa é obrigatório';
      if (!job.startDate) newErrors[`workHistory-startDate-${index}`] = 'Data de Início é obrigatória';
      if (!job.endDate) newErrors[`workHistory-endDate-${index}`] = 'Data de Término é obrigatória';

      const [startMonth, startYear] = job.startDate.split('/');
      const [endMonth, endYear] = job.endDate.split('/');

      if (startYear > currentYear || (startYear == currentYear && startMonth > currentMonth)) {
        newErrors[`workHistory-startDate-${index}`] = 'Data de Início não pode estar no futuro';
      }
      if (endYear > currentYear || (endYear == currentYear && endMonth > currentMonth)) {
        newErrors[`workHistory-endDate-${index}`] = 'Data de Término não pode estar no futuro';
      }
      if (startYear > endYear || (startYear == endYear && startMonth > endMonth)) {
        newErrors[`workHistory-startDate-${index}`] = 'Data de Início não pode ser depois da Data de Término';
        newErrors[`workHistory-endDate-${index}`] = 'Data de Término não pode ser antes da Data de Início';
      }

      if (!job.description.length) newErrors[`workHistory-description-${index}`] = 'Descrição é obrigatória';
      if (!job.technologies.length) newErrors[`workHistory-technologies-${index}`] = 'Tecnologias são obrigatórias';
    });

    form.education.forEach((edu, index) => {
      if (!edu.degree) newErrors[`education-degree-${index}`] = 'Grau é obrigatório';
      if (!edu.institution) newErrors[`education-institution-${index}`] = 'Instituição é obrigatória';
      if (!edu.startDate) newErrors[`education-startDate-${index}`] = 'Data de Início é obrigatória';
      if (!edu.endDate) newErrors[`education-endDate-${index}`] = 'Data de Término é obrigatória';

      const [startMonth, startYear] = edu.startDate.split('/');
      const [endMonth, endYear] = edu.endDate.split('/');

      if (startYear > currentYear || (startYear == currentYear && startMonth > currentMonth)) {
        newErrors[`education-startDate-${index}`] = 'Data de Início não pode estar no futuro';
      }
      if (endYear > currentYear || (endYear == currentYear && endMonth > currentMonth)) {
        newErrors[`education-endDate-${index}`] = 'Data de Término não pode estar no futuro';
      }
      if (startYear > endYear || (startYear == endYear && startMonth > endMonth)) {
        newErrors[`education-startDate-${index}`] = 'Data de Início não pode ser depois da Data de Término';
        newErrors[`education-endDate-${index}`] = 'Data de Término não pode ser antes da Data de Início';
      }
    });

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  const calculateDuration = (startDate, endDate) => {
    const [startMonth, startYear] = startDate.split('/');
    const [endMonth, endYear] = endDate.split('/');
    const start = new Date(startYear, startMonth - 1);
    const end = new Date(endYear, endMonth - 1);
    const diff = end - start;
    const months = diff / (1000 * 60 * 60 * 24 * 30);
    const years = Math.floor(months / 12);
    const remainingMonths = Math.floor(months % 12);

    let duration = '';
    if (years > 0) duration += `${years} ano${years > 1 ? 's' : ''}`;
    if (remainingMonths > 0) duration += `${years > 0 ? ' e ' : ''}${remainingMonths} mês${remainingMonths > 1 ? 'es' : ''}`;

    return duration;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const pdfBlob = await generatePDF(resume);
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  return (
    <Container>
      <Title>Construtor de Currículo</Title>
      <form onSubmit={handleSubmit}>
        <FormSection className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Nome</Label>
            <Input
              type="text"
              name="name"
              value={resume.name}
              onChange={handleChange}
              placeholder="Ex: Micael Santana"
              disabled={isEditing.section !== null && isEditing.section !== 'name'}
            />
            {errors.name && <Error>{errors.name}</Error>}
          </div>
          <div>
            <Label>Telefone</Label>
            <InputMask
              mask="+99 (99) 99999-9999"
              value={resume.telephone}
              onChange={(e) => handleChange(e, null, null, 'telephone')}
              disabled={isEditing.section !== null && isEditing.section !== 'telephone'}
            >
              {() => (
                <Input
                  type="text"
                  name="telephone"
                  placeholder="Ex: (+55) 47 99642-8339"
                />
              )}
            </InputMask>
            {errors.telephone && <Error>{errors.telephone}</Error>}
          </div>
        </FormSection>
        <FormSection className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Localização</Label>
            <Input
              type="text"
              name="location"
              value={resume.location}
              onChange={handleChange}
              placeholder="Ex: Navegantes, Santa Catarina"
              disabled={isEditing.section !== null && isEditing.section !== 'location'}
            />
            {errors.location && <Error>{errors.location}</Error>}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              value={resume.email}
              onChange={handleChange}
              placeholder="Ex: micaelparadox@gmail.com"
              disabled={isEditing.section !== null && isEditing.section !== 'email'}
            />
            {errors.email && <Error>{errors.email}</Error>}
          </div>
        </FormSection>
        <FormSection>
          <Label>LinkedIn</Label>
          <Input
            type="url"
            name="linkedin"
            value={resume.linkedin}
            onChange={handleChange}
            placeholder="Ex: https://www.linkedin.com/in/micasan"
            disabled={isEditing.section !== null && isEditing.section !== 'linkedin'}
          />
          {errors.linkedin && <Error>{errors.linkedin}</Error>}
        </FormSection>
        <FormSection>
          <Label>Resumo</Label>
          <TextArea
            name="summary"
            value={resume.summary}
            onChange={handleChange}
            rows="4"
            placeholder="Com 11 anos em TI, eu me especializo em Java, Spring, Quarkus, AWS, e Microservices. Minha experiência full-stack inclui..."
            disabled={isEditing.section !== null && isEditing.section !== 'summary'}
          ></TextArea>
          {errors.summary && <Error>{errors.summary}</Error>}
        </FormSection>

        <FormSection>
          <h2 className="text-xl font-semibold text-gray-200">Histórico de Trabalho</h2>
          {resume.workHistory.map((job, index) => (
            <div key={index} className="space-y-4 border-b border-gray-600 pb-4 mb-4 relative">
              <Button
                type="button"
                className="remove"
                onClick={() => handleDelete('workHistory', index)}
              >
                <FaTrashAlt /> Remover
              </Button>
              <div>
                <Label>Título</Label>
                <Input
                  type="text"
                  value={job.title}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'title')}
                  placeholder="Ex: Senior Software Consultant"
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                />
                {errors[`workHistory-title-${index}`] && <Error>{errors[`workHistory-title-${index}`]}</Error>}
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  type="text"
                  value={job.company}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'company')}
                  placeholder="Ex: Venha Pra Nuvem"
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                />
                {errors[`workHistory-company-${index}`] && <Error>{errors[`workHistory-company-${index}`]}</Error>}
              </div>
              <div>
                <Label>Data de Início</Label>
                <InputMask
                  mask="99/9999"
                  value={job.startDate}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'startDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                >
                  {() => (
                    <Input
                      type="text"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`workHistory-startDate-${index}`] && <Error>{errors[`workHistory-startDate-${index}`]}</Error>}
              </div>
              <div>
                <Label>Data de Término</Label>
                <InputMask
                  mask="99/9999"
                  value={job.endDate}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'endDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                >
                  {() => (
                    <Input
                      type="text"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`workHistory-endDate-${index}`] && <Error>{errors[`workHistory-endDate-${index}`]}</Error>}
              </div>
              <div>
                <Label>Duração</Label>
                <Input
                  type="text"
                  value={job.duration}
                  readOnly
                  placeholder="Ex: 2 meses"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <TextArea
                  value={job.description.join('\n')}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'description')}
                  rows="3"
                  placeholder="Ex: Consultoria em projetos Java, Spring Boot, Pub/Sub..."
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                ></TextArea>
                {errors[`workHistory-description-${index}`] && <Error>{errors[`workHistory-description-${index}`]}</Error>}
              </div>
              <div>
                <Label>Tecnologias</Label>
                <Input
                  type="text"
                  value={job.technologies.join(', ')}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'technologies')}
                  placeholder="Ex: Java, Spring Boot, Pub/Sub, PostgreSQL..."
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                />
                {errors[`workHistory-technologies-${index}`] && <Error>{errors[`workHistory-technologies-${index}`]}</Error>}
              </div>
              <Button
                type="button"
                className="edit"
                onClick={() => handleEdit('workHistory', index)}
              >
                <FaEdit /> Editar
              </Button>
            </div>
          ))}
          <Button type="button" className="add" onClick={() => handleAdd('workHistory')}>
            <FaPlus /> Adicionar Histórico de Trabalho
          </Button>
        </FormSection>

        <FormSection ref={educationRef}>
          <h2 className="text-xl font-semibold text-gray-200">Educação</h2>
          {resume.education.map((edu, index) => (
            <div key={index} className="space-y-4 border-b border-gray-600 pb-4 mb-4 relative">
              <Button
                type="button"
                className="remove"
                onClick={() => handleDelete('education', index)}
              >
                <FaTrashAlt /> Remover
              </Button>
              <div>
                <Label>Grau</Label>
                <Input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleChange(e, 'education', index, 'degree')}
                  placeholder="Ex: Bachelor's degree, Computer Science"
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                />
                {errors[`education-degree-${index}`] && <Error>{errors[`education-degree-${index}`]}</Error>}
              </div>
              <div>
                <Label>Instituição</Label>
                <Input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleChange(e, 'education', index, 'institution')}
                  placeholder="Ex: Universidade do Vale do Itajaí"
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                />
                {errors[`education-institution-${index}`] && <Error>{errors[`education-institution-${index}`]}</Error>}
              </div>
              <div>
                <Label>Data de Início</Label>
                <InputMask
                  mask="99/9999"
                  value={edu.startDate}
                  onChange={(e) => handleChange(e, 'education', index, 'startDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                >
                  {() => (
                    <Input
                      type="text"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`education-startDate-${index}`] && <Error>{errors[`education-startDate-${index}`]}</Error>}
              </div>
              <div>
                <Label>Data de Término</Label>
                <InputMask
                  mask="99/9999"
                  value={edu.endDate}
                  onChange={(e) => handleChange(e, 'education', index, 'endDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                >
                  {() => (
                    <Input
                      type="text"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`education-endDate-${index}`] && <Error>{errors[`education-endDate-${index}`]}</Error>}
              </div>
              <Button
                type="button"
                className="edit"
                onClick={() => handleEdit('education', index)}
              >
                <FaEdit /> Editar
              </Button>
            </div>
          ))}
          <Button type="button" className="add" onClick={() => handleAdd('education')}>
            <FaPlus /> Adicionar Educação
          </Button>
        </FormSection>

        {isFormValid && (
          <Button type="submit" className="add">
            <FaSave /> Gerar PDF
          </Button>
        )}
      </form>
    </Container>
  );
}

export default Form;
