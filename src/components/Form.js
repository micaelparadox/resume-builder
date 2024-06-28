"use client";

import React, { useState, useRef, useEffect } from 'react';
import { generatePDF } from '../api/resumeApi';
import InputMask from 'react-input-mask';

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
    <div className="container mx-auto p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Construtor de Currículo</h1>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              name="name"
              value={resume.name}
              onChange={handleChange}
              className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
              placeholder="Ex: Micael Santana"
              disabled={isEditing.section !== null && isEditing.section !== 'name'}
            />
            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <InputMask
              mask="+99 (99) 99999-9999"
              value={resume.telephone}
              onChange={(e) => handleChange(e, null, null, 'telephone')}
              disabled={isEditing.section !== null && isEditing.section !== 'telephone'}
            >
              {() => (
                <input
                  type="text"
                  name="telephone"
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  placeholder="Ex: (+55) 47 99642-8339"
                />
              )}
            </InputMask>
            {errors.telephone && <span className="text-red-500 text-sm">{errors.telephone}</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Localização</label>
            <input
              type="text"
              name="location"
              value={resume.location}
              onChange={handleChange}
              className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
              placeholder="Ex: Navegantes, Santa Catarina"
              disabled={isEditing.section !== null && isEditing.section !== 'location'}
            />
            {errors.location && <span className="text-red-500 text-sm">{errors.location}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={resume.email}
              onChange={handleChange}
              className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
              placeholder="Ex: micaelparadox@gmail.com"
              disabled={isEditing.section !== null && isEditing.section !== 'email'}
            />
            {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
          <input
            type="url"
            name="linkedin"
            value={resume.linkedin}
            onChange={handleChange}
            className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
            placeholder="Ex: https://www.linkedin.com/in/micasan"
            disabled={isEditing.section !== null && isEditing.section !== 'linkedin'}
          />
          {errors.linkedin && <span className="text-red-500 text-sm">{errors.linkedin}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Resumo</label>
          <textarea
            name="summary"
            value={resume.summary}
            onChange={handleChange}
            className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
            rows="4"
            placeholder="Com 11 anos em TI, eu me especializo em Java, Spring, Quarkus, AWS, e Microservices. Minha experiência full-stack inclui..."
            disabled={isEditing.section !== null && isEditing.section !== 'summary'}
          ></textarea>
          {errors.summary && <span className="text-red-500 text-sm">{errors.summary}</span>}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800">Histórico de Trabalho</h2>
          {resume.workHistory.map((job, index) => (
            <div key={index} className="space-y-4 border-b border-gray-200 pb-4 mb-4 relative">
              <button
                type="button"
                className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
                onClick={() => handleDelete('workHistory', index)}
              >
                Remover
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  value={job.title}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'title')}
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  placeholder="Ex: Senior Software Consultant"
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                />
                {errors[`workHistory-title-${index}`] && <span className="text-red-500 text-sm">{errors[`workHistory-title-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Empresa</label>
                <input
                  type="text"
                  value={job.company}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'company')}
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  placeholder="Ex: Venha Pra Nuvem"
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                />
                {errors[`workHistory-company-${index}`] && <span className="text-red-500 text-sm">{errors[`workHistory-company-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                <InputMask
                  mask="99/9999"
                  value={job.startDate}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'startDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                >
                  {() => (
                    <input
                      type="text"
                      className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`workHistory-startDate-${index}`] && <span className="text-red-500 text-sm">{errors[`workHistory-startDate-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Término</label>
                <InputMask
                  mask="99/9999"
                  value={job.endDate}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'endDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                >
                  {() => (
                    <input
                      type="text"
                      className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`workHistory-endDate-${index}`] && <span className="text-red-500 text-sm">{errors[`workHistory-endDate-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duração</label>
                <input
                  type="text"
                  value={job.duration}
                  readOnly
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  placeholder="Ex: 2 meses"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={job.description.join('\n')}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'description')}
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Ex: Consultoria em projetos Java, Spring Boot, Pub/Sub..."
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                ></textarea>
                {errors[`workHistory-description-${index}`] && <span className="text-red-500 text-sm">{errors[`workHistory-description-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tecnologias</label>
                <input
                  type="text"
                  value={job.technologies.join(', ')}
                  onChange={(e) => handleChange(e, 'workHistory', index, 'technologies')}
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  placeholder="Ex: Java, Spring Boot, Pub/Sub, PostgreSQL..."
                  disabled={isEditing.section !== null && (isEditing.section !== 'workHistory' || isEditing.index !== index)}
                />
                {errors[`workHistory-technologies-${index}`] && <span className="text-red-500 text-sm">{errors[`workHistory-technologies-${index}`]}</span>}
              </div>
              <button
                type="button"
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                onClick={() => handleEdit('workHistory', index)}
              >
                Editar
              </button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('workHistory')} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Adicionar Histórico de Trabalho</button>
        </div>

        <div ref={educationRef}>
          <h2 className="text-xl font-semibold text-gray-800">Educação</h2>
          {resume.education.map((edu, index) => (
            <div key={index} className="space-y-4 border-b border-gray-200 pb-4 mb-4 relative">
              <button
                type="button"
                className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
                onClick={() => handleDelete('education', index)}
              >
                Remover
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grau</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleChange(e, 'education', index, 'degree')}
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  placeholder="Ex: Bachelor's degree, Computer Science"
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                />
                {errors[`education-degree-${index}`] && <span className="text-red-500 text-sm">{errors[`education-degree-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Instituição</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleChange(e, 'education', index, 'institution')}
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                  placeholder="Ex: Universidade do Vale do Itajaí"
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                />
                {errors[`education-institution-${index}`] && <span className="text-red-500 text-sm">{errors[`education-institution-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                <InputMask
                  mask="99/9999"
                  value={edu.startDate}
                  onChange={(e) => handleChange(e, 'education', index, 'startDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                >
                  {() => (
                    <input
                      type="text"
                      className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`education-startDate-${index}`] && <span className="text-red-500 text-sm">{errors[`education-startDate-${index}`]}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Término</label>
                <InputMask
                  mask="99/9999"
                  value={edu.endDate}
                  onChange={(e) => handleChange(e, 'education', index, 'endDate')}
                  disabled={isEditing.section !== null && (isEditing.section !== 'education' || isEditing.index !== index)}
                >
                  {() => (
                    <input
                      type="text"
                      className="mt-1 p-3 block w-full border border-gray-300 rounded-md"
                      placeholder="MM/YYYY"
                    />
                  )}
                </InputMask>
                {errors[`education-endDate-${index}`] && <span className="text-red-500 text-sm">{errors[`education-endDate-${index}`]}</span>}
              </div>
              <button
                type="button"
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                onClick={() => handleEdit('education', index)}
              >
                Editar
              </button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('education')} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Adicionar Educação</button>
        </div>

        {isFormValid && (
          <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Gerar PDF</button>
        )}
      </form>
    </div>
  );
}

export default Form;
