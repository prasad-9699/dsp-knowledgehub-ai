-- DSP Investment Platform - Database Initialization
-- Creates required databases and extensions

-- Create additional databases
CREATE DATABASE mlflow;
CREATE DATABASE airflow;

-- Enable TimescaleDB extension
\c dsp_investment;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS market;
CREATE SCHEMA IF NOT EXISTS portfolio;
CREATE SCHEMA IF NOT EXISTS ml;
CREATE SCHEMA IF NOT EXISTS client;
CREATE SCHEMA IF NOT EXISTS research;
CREATE SCHEMA IF NOT EXISTS audit;
