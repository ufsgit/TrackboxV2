-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: trackbox_v2
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `affiliate_referrals`
--

DROP TABLE IF EXISTS `affiliate_referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliate_referrals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `affiliate_id` int DEFAULT NULL,
  `referred_business_id` int DEFAULT NULL,
  `commission` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `affiliate_id` (`affiliate_id`),
  CONSTRAINT `affiliate_referrals_ibfk_1` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliate_referrals`
--

LOCK TABLES `affiliate_referrals` WRITE;
/*!40000 ALTER TABLE `affiliate_referrals` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliate_referrals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `affiliates`
--

DROP TABLE IF EXISTS `affiliates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `referral_code` varchar(20) DEFAULT NULL,
  `total_referrals` int DEFAULT '0',
  `total_earnings` decimal(10,2) DEFAULT '0.00',
  `pending_payout` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `referral_code` (`referral_code`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `affiliates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliates`
--

LOCK TABLES `affiliates` WRITE;
/*!40000 ALTER TABLE `affiliates` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics`
--

DROP TABLE IF EXISTS `analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `metric_type` varchar(100) DEFAULT NULL,
  `metric_value` decimal(15,2) DEFAULT NULL,
  `dimension` varchar(100) DEFAULT NULL,
  `recorded_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `analytics_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics`
--

LOCK TABLES `analytics` WRITE;
/*!40000 ALTER TABLE `analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_history`
--

DROP TABLE IF EXISTS `application_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `application_id` (`application_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `application_history_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `application_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_history`
--

LOCK TABLES `application_history` WRITE;
/*!40000 ALTER TABLE `application_history` DISABLE KEYS */;
INSERT INTO `application_history` VALUES (4,3,70,'Application Created','Initial application created.','2026-11-25 07:45:00');
/*!40000 ALTER TABLE `application_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_status_change`
--

DROP TABLE IF EXISTS `application_status_change`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_status_change` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `status_change_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `old_status_id` int DEFAULT NULL,
  `old_status_name` varchar(255) DEFAULT NULL,
  `new_status_id` int DEFAULT NULL,
  `new_status_name` varchar(255) DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `application_id` (`application_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `application_status_change_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `application_status_change_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_status_change`
--

LOCK TABLES `application_status_change` WRITE;
/*!40000 ALTER TABLE `application_status_change` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_status_change` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_statuses`
--

DROP TABLE IF EXISTS `application_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT '#475569',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `application_statuses_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_statuses`
--

LOCK TABLES `application_statuses` WRITE;
/*!40000 ALTER TABLE `application_statuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_years`
--

DROP TABLE IF EXISTS `application_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `year` varchar(4) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `application_years_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_years`
--

LOCK TABLES `application_years` WRITE;
/*!40000 ALTER TABLE `application_years` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `country` varchar(255) NOT NULL,
  `university` varchar(255) NOT NULL,
  `course` varchar(255) NOT NULL,
  `intake_id` int DEFAULT NULL,
  `year_id` int DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `description` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `contact_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `intake_id` (`intake_id`),
  KEY `status_id` (`status_id`),
  KEY `created_by` (`created_by`),
  KEY `applications_ibfk_3` (`year_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`intake_id`) REFERENCES `intakes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`year_id`) REFERENCES `years` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_ibfk_4` FOREIGN KEY (`status_id`) REFERENCES `application_statuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (3,1,'New Zealand','dvd','vdv',NULL,NULL,NULL,'',NULL,'2026-11-25 07:45:00','2026-11-25 07:45:00',865);
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `menu` enum('lead','crm','operation','hr') DEFAULT NULL,
  `check_in_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `check_out_time` timestamp NULL DEFAULT NULL,
  `total_minutes` int DEFAULT NULL,
  `is_late` tinyint(1) DEFAULT '0',
  `late_reason` text,
  `status` varchar(50) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_logs`
--

LOCK TABLES `attendance_logs` WRITE;
/*!40000 ALTER TABLE `attendance_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'ufs',NULL,NULL,NULL,'2026-11-17 08:30:10','2026-11-17 08:30:10'),(2,'test',NULL,NULL,NULL,'2026-11-26 11:55:42','2026-11-26 11:55:42');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcast_logs`
--

DROP TABLE IF EXISTS `broadcast_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcast_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `broadcast_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'sent',
  `wa_message_id` varchar(100) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `broadcast_id` (`broadcast_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `broadcast_logs_ibfk_1` FOREIGN KEY (`broadcast_id`) REFERENCES `broadcasts` (`id`),
  CONSTRAINT `broadcast_logs_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcast_logs`
--

LOCK TABLES `broadcast_logs` WRITE;
/*!40000 ALTER TABLE `broadcast_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcast_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcasts`
--

DROP TABLE IF EXISTS `broadcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcasts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `template_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `target_tags` json DEFAULT NULL,
  `target_contact_ids` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_recipients` int DEFAULT '0',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_read` int DEFAULT '0',
  `total_failed` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `broadcasts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `broadcasts_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcasts`
--

LOCK TABLES `broadcasts` WRITE;
/*!40000 ALTER TABLE `broadcasts` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `businesses`
--

DROP TABLE IF EXISTS `businesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `businesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `fb_page_id` varchar(100) DEFAULT NULL,
  `ig_account_id` varchar(100) DEFAULT NULL,
  `whatsapp_token` text,
  `whatsapp_phone_id` varchar(100) DEFAULT NULL,
  `fb_verify_token` varchar(100) DEFAULT NULL,
  `plan` enum('starter','pro','enterprise') DEFAULT 'starter',
  `green_tick_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `company_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businesses`
--

LOCK TABLES `businesses` WRITE;
/*!40000 ALTER TABLE `businesses` DISABLE KEYS */;
INSERT INTO `businesses` VALUES (1,'Demo Business','+15556377030',NULL,NULL,NULL,NULL,NULL,'pro','verified','2026-11-11 07:08:03',NULL),(6,'Demo Business','+911234567890',NULL,NULL,NULL,NULL,NULL,'pro','pending','2026-11-11 06:48:35',NULL);
/*!40000 ALTER TABLE `businesses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `channels`
--

DROP TABLE IF EXISTS `channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_business_channel` (`business_id`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channels`
--

LOCK TABLES `channels` WRITE;
/*!40000 ALTER TABLE `channels` DISABLE KEYS */;
INSERT INTO `channels` VALUES (7,1,'Direct Walkin','2026-11-19 07:28:06','2026-11-19 07:28:06'),(8,1,'Call Walkin','2026-11-19 07:28:06','2026-11-19 07:28:06'),(9,1,'New Call','2026-11-19 07:28:06','2026-11-19 07:28:06'),(10,1,'Reference Walkin','2026-11-19 07:28:06','2026-11-19 07:28:06'),(11,1,'Instagram AD','2026-11-19 07:28:06','2026-11-19 07:28:06'),(12,1,'Unknown','2026-11-19 07:28:06','2026-11-19 07:28:06'),(13,1,'Website','2026-11-27 05:34:23','2026-11-27 05:34:23'),(14,1,'Instagram','2026-11-27 05:34:23','2026-11-27 05:34:23'),(15,1,'Facebook','2026-11-27 05:34:23','2026-11-27 05:34:23'),(16,1,'WhatsApp','2026-11-27 05:34:23','2026-11-27 05:34:23'),(17,1,'Referral','2026-11-27 05:34:23','2026-11-27 05:34:23'),(18,1,'Walk-in','2026-11-27 05:34:23','2026-11-27 05:34:23'),(19,1,'Google Ads','2026-11-27 05:34:23','2026-11-27 05:34:23'),(20,1,'LinkedIn','2026-11-27 05:34:23','2026-11-27 05:34:23'),(21,1,'Education Fair','2026-11-27 05:34:23','2026-11-27 05:34:23'),(22,1,'Direct Call','2026-11-27 05:34:23','2026-11-27 05:34:23');
/*!40000 ALTER TABLE `channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbot_sessions`
--

DROP TABLE IF EXISTS `chatbot_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatbot_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatbot_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `current_node_id` varchar(100) DEFAULT NULL,
  `session_data` json DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `chatbot_sessions_ibfk_1` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbots` (`id`),
  CONSTRAINT `chatbot_sessions_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbot_sessions`
--

LOCK TABLES `chatbot_sessions` WRITE;
/*!40000 ALTER TABLE `chatbot_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatbot_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbots`
--

DROP TABLE IF EXISTS `chatbots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatbots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `trigger_keywords` json DEFAULT NULL,
  `flow` json DEFAULT NULL,
  `ai_enabled` tinyint(1) DEFAULT '0',
  `openai_system_prompt` text,
  `is_active` tinyint(1) DEFAULT '1',
  `channel` varchar(100) DEFAULT 'whatsapp',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `chatbots_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbots`
--

LOCK TABLES `chatbots` WRITE;
/*!40000 ALTER TABLE `chatbots` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatbots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_config`
--

DROP TABLE IF EXISTS `company_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `is_email` tinyint(1) DEFAULT '0',
  `logo` varchar(500) DEFAULT NULL,
  `favicon` varchar(500) DEFAULT NULL,
  `company_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_config`
--

LOCK TABLES `company_config` WRITE;
/*!40000 ALTER TABLE `company_config` DISABLE KEYS */;
INSERT INTO `company_config` VALUES (4,'Trackbox','Trackbox CRM',0,'assets/logos/trackbox-logo.png','assets/icons/trackbox-logo.png',0),(5,'Choice','Choice CRM',1,'assets/logos/choice-logo.png','assets/icons/choice-icon.png',1);
/*!40000 ALTER TABLE `company_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_custom_values`
--

DROP TABLE IF EXISTS `contact_custom_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_custom_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `field_id` int NOT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_contact_field` (`contact_id`,`field_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `contact_custom_values_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `lead_fields` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_custom_values_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_custom_values`
--

LOCK TABLES `contact_custom_values` WRITE;
/*!40000 ALTER TABLE `contact_custom_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_custom_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_history`
--

DROP TABLE IF EXISTS `contact_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text,
  `new_value` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contact_history_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_history_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_history_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=274 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_history`
--

LOCK TABLES `contact_history` WRITE;
/*!40000 ALTER TABLE `contact_history` DISABLE KEYS */;
INSERT INTO `contact_history` VALUES (11,864,1,131,'follow_up_date',NULL,'2026-11-23','2026-11-23 12:08:50'),(13,738,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(14,738,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(15,739,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(16,739,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(17,740,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(18,740,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(19,741,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(20,741,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(21,742,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(22,742,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(23,743,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(24,743,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(25,744,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(26,744,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(27,745,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(28,745,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(29,746,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(30,746,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(31,747,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(32,747,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(33,748,1,70,'assigned_to','502','502','2026-11-24 11:04:12'),(34,748,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:12'),(35,749,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(36,749,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(37,750,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(38,750,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(39,751,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(40,751,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(41,752,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(42,752,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(43,753,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(44,753,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(45,754,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(46,754,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(47,755,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(48,755,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(49,756,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(50,756,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(51,757,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(52,757,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(53,758,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(54,758,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(55,759,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(56,759,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(57,760,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(58,760,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(59,761,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(60,761,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(61,762,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(62,762,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(63,763,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(64,763,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(65,764,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(66,764,1,70,'status_id','	New Lead','	Proceeding','2026-11-24 11:04:13'),(67,765,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(68,765,1,70,'status_id','Pending Documents','	Proceeding','2026-11-24 11:04:13'),(69,766,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(70,766,1,70,'status_id','Application Submitted','	Proceeding','2026-11-24 11:04:13'),(71,767,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(72,767,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(73,768,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(74,768,1,70,'status_id','Lost','	Proceeding','2026-11-24 11:04:13'),(75,769,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(76,769,1,70,'status_id','No Response','	Proceeding','2026-11-24 11:04:13'),(77,770,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(78,770,1,70,'status_id','Application Submitted','	Proceeding','2026-11-24 11:04:13'),(79,771,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(80,771,1,70,'status_id','Application Drafted','	Proceeding','2026-11-24 11:04:13'),(81,772,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(82,772,1,70,'status_id','Pending Documents','	Proceeding','2026-11-24 11:04:13'),(83,773,1,70,'assigned_to','502','502','2026-11-24 11:04:13'),(84,773,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(85,774,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(86,774,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(87,775,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(88,775,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(89,776,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(90,776,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(91,777,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(92,777,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(93,778,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(94,778,1,70,'status_id','Lost / Diverted','	Proceeding','2026-11-24 11:04:13'),(95,779,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(96,779,1,70,'status_id','Follow Up','	Proceeding','2026-11-24 11:04:13'),(97,780,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(98,780,1,70,'status_id','Decision Pending','	Proceeding','2026-11-24 11:04:13'),(99,781,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(100,781,1,70,'status_id','No Response','	Proceeding','2026-11-24 11:04:13'),(101,782,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(102,782,1,70,'status_id','Decision Pending','	Proceeding','2026-11-24 11:04:13'),(103,783,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(104,783,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(105,784,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(106,784,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(107,785,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(108,785,1,70,'status_id','Offer Received','	Proceeding','2026-11-24 11:04:13'),(109,786,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(110,786,1,70,'status_id','No Response','	Proceeding','2026-11-24 11:04:13'),(111,787,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(112,787,1,70,'status_id','Pending Documents','	Proceeding','2026-11-24 11:04:13'),(113,788,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(114,788,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(115,789,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(116,789,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(117,790,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(118,790,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(119,791,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(120,791,1,70,'status_id','Offer Received','	Proceeding','2026-11-24 11:04:13'),(121,792,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(122,792,1,70,'status_id','Offer Received','	Proceeding','2026-11-24 11:04:13'),(123,793,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(124,793,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(125,794,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(126,794,1,70,'status_id','Lost','	Proceeding','2026-11-24 11:04:13'),(127,795,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(128,795,1,70,'status_id','Visa Stage','	Proceeding','2026-11-24 11:04:13'),(129,796,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(130,796,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(131,797,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(132,797,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(133,798,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(134,798,1,70,'status_id','Lost','	Proceeding','2026-11-24 11:04:13'),(135,799,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(136,799,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(137,800,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(138,800,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(139,801,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(140,801,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(141,802,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(142,802,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(143,803,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(144,803,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(145,804,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(146,804,1,70,'status_id','Lost','	Proceeding','2026-11-24 11:04:13'),(147,805,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(148,805,1,70,'status_id','Lost','	Proceeding','2026-11-24 11:04:13'),(149,806,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(150,806,1,70,'status_id','Lost','	Proceeding','2026-11-24 11:04:13'),(151,807,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(152,807,1,70,'status_id','No Response','	Proceeding','2026-11-24 11:04:13'),(153,808,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(154,808,1,70,'status_id','Lost','	Proceeding','2026-11-24 11:04:13'),(155,809,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(156,810,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(157,811,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(158,812,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(159,812,1,70,'status_id','Decision Pending','	Proceeding','2026-11-24 11:04:13'),(160,813,1,70,'assigned_to','502','131','2026-11-24 11:04:13'),(161,814,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(162,814,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(163,815,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(164,815,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(165,816,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(166,816,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(167,817,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(168,817,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(169,818,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(170,818,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(171,819,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(172,819,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(173,820,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(174,820,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(175,821,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(176,821,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(177,822,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(178,822,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(179,823,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(180,823,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(181,824,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(182,824,1,70,'status_id','Visa Stage','	Proceeding','2026-11-24 11:04:13'),(183,825,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(184,825,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(185,826,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(186,826,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(187,827,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(188,827,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(189,828,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(190,828,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(191,829,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(192,829,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(193,830,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(194,830,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(195,831,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(196,831,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(197,832,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(198,832,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(199,833,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(200,833,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(201,834,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(202,834,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(203,835,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(204,835,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(205,836,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(206,836,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(207,837,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(208,837,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(209,838,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(210,838,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(211,839,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(212,839,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(213,840,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(214,840,1,70,'status_id','Pending Documents','	Proceeding','2026-11-24 11:04:13'),(215,841,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(216,841,1,70,'status_id','Offer Received','	Proceeding','2026-11-24 11:04:13'),(217,842,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(218,842,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(219,843,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(220,843,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(221,844,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(222,844,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(223,845,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(224,845,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(225,846,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(226,846,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(227,847,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(228,847,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(229,848,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(230,848,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(231,849,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(232,849,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(233,850,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(234,850,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(235,851,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(236,851,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(237,852,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(238,852,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(239,853,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(240,853,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(241,854,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(242,854,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(243,855,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(244,855,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(245,856,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(246,856,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(247,857,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(248,857,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(249,858,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(250,858,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(251,859,1,70,'assigned_to','502','132','2026-11-24 11:04:13'),(252,859,1,70,'status_id','In Progress','	Proceeding','2026-11-24 11:04:13'),(259,864,1,70,'assigned_to','131','132','2026-11-24 11:04:13'),(260,864,1,70,'status_id','Decision Pending','	Proceeding','2026-11-24 11:04:13'),(263,738,1,70,'follow_up_date','2026-11-19','2026-11-26','2026-11-26 05:46:10'),(264,742,1,502,'follow_up_date','2026-11-19','2026-11-26','2026-11-26 07:31:36'),(265,739,1,70,'follow_up_date','2026-11-19','2026-11-27','2026-11-27 07:08:11'),(266,741,1,70,'follow_up_date','2026-11-19','2026-11-27','2026-11-27 07:08:39'),(267,740,1,70,'follow_up_date','2026-11-19','2026-12-01','2026-11-27 07:09:37'),(268,743,1,70,'follow_up_date','2026-11-19','2026-11-30','2026-11-27 07:10:02'),(269,864,1,70,'follow_up_date',NULL,'2026-11-27','2026-11-27 07:48:09'),(270,857,1,70,'follow_up_date','2026-11-19','2026-11-27','2026-11-27 07:54:47'),(271,856,1,70,'follow_up_date','2026-11-19','2026-11-27','2026-11-27 07:54:57'),(272,859,1,70,'follow_up_date','2026-11-19','2026-11-28','2026-11-28 04:36:04'),(273,859,1,70,'follow_up_date','2026-11-28','2026-11-30','2026-11-28 04:36:29');
/*!40000 ALTER TABLE `contact_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_qualifications`
--

DROP TABLE IF EXISTS `contact_qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_qualifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `qualification` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `completion_year` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentage_cgpa` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `backlogs` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '0',
  `study_gap` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_highest` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qualifications_contact` (`contact_id`),
  KEY `idx_qualifications_business` (`business_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `contact_qualifications_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_qualifications_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_qualifications_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_qualifications`
--

LOCK TABLES `contact_qualifications` WRITE;
/*!40000 ALTER TABLE `contact_qualifications` DISABLE KEYS */;
INSERT INTO `contact_qualifications` VALUES (3,859,1,'ghj','ghjkl','','','0','',1,0,70,'2026-11-20 05:18:28','2026-11-20 05:18:28');
/*!40000 ALTER TABLE `contact_qualifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_tasks`
--

DROP TABLE IF EXISTS `contact_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `contact_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `contact_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `dept_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `assigned_to` int NOT NULL,
  `assigned_to_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_by` int NOT NULL,
  `created_by_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0: Pending, 1: Completed',
  `is_task_date` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: Disabled, 1: Enabled',
  `task_date` date DEFAULT NULL COMMENT 'Promised submission date',
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_branch_id` (`branch_id`),
  KEY `idx_dept_id` (`dept_id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_status` (`status`),
  KEY `idx_task_date` (`task_date`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_tasks`
--

LOCK TABLES `contact_tasks` WRITE;
/*!40000 ALTER TABLE `contact_tasks` DISABLE KEYS */;
INSERT INTO `contact_tasks` VALUES (1,366,'Anas','918592873809',1,'ufs',1,'test','g','g',502,'Priya Sharma',70,'Administrator',0,1,'2026-11-17',NULL,'2026-11-17 09:08:16','2026-11-17 09:08:38'),(2,366,'Anas','918592873809',1,'ufs',1,'test','g','g',70,'Administrator',70,'Administrator',0,1,'2026-11-17',NULL,'2026-11-17 10:33:53','2026-11-17 10:41:16'),(3,366,'Anas','918592873809',1,'ufs',1,'test','t','t',70,'Administrator',70,'Administrator',0,1,'2026-11-18',NULL,'2026-11-17 10:34:09','2026-11-17 10:41:13'),(4,366,'Anas','918592873809',1,'ufs',1,'test','tgt','gtg',70,'Administrator',70,'Administrator',0,1,'2026-11-19',NULL,'2026-11-17 10:34:22','2026-11-17 10:34:22'),(5,366,'Anas','918592873809',1,'ufs',1,'test','j','h',70,'Administrator',70,'Administrator',0,0,NULL,NULL,'2026-11-17 10:43:09','2026-11-17 10:43:09'),(6,365,'Abhijith Siju','918943391979',1,'ufs',1,'test','testq','test',70,'Administrator',70,'Administrator',1,1,'2026-11-10','2026-11-17 16:16:03','2026-11-17 10:45:44','2026-11-17 10:46:03'),(7,365,'Abhijith Siju','918943391979',1,'ufs',1,'test','vv','cs',70,'Administrator',70,'Administrator',0,1,'2026-11-17',NULL,'2026-11-17 10:46:00','2026-11-17 10:46:00'),(8,366,'Anas','918592873809',1,'ufs',1,'test','t1','t1',70,'Administrator',70,'Administrator',0,1,'2026-11-01',NULL,'2026-11-17 10:48:32','2026-11-17 10:48:32'),(9,366,'Anas','918592873809',1,'ufs',1,'test','Visa Approved: Initiate Pre-Departure Briefing & Checklist','Official Visa approval received on 2026-11-18. Complete pre-departure checklist: briefing, flight booking, health insurance, accommodation & airport transit.',502,'Priya Sharma',70,'Administrator',0,1,'2026-11-21',NULL,'2026-11-18 08:27:04','2026-11-18 08:27:04'),(10,366,'Anas','918592873809',1,'ufs',1,'test','[RFI] Immigration Request: test','Official request received on 2026-11-18. Due date: 2026-12-02. Notes: td',502,'Priya Sharma',70,'Administrator',1,1,'2026-12-02','2026-11-18 14:40:50','2026-11-18 09:10:10','2026-11-18 09:10:50'),(11,366,'Anas','918592873809',1,'ufs',1,'test','[RFI] Immigration Request: u','Official request received on 2026-11-18. Due date: 2026-12-02. Notes: Respond before deadline.',502,'Priya Sharma',70,'Administrator',0,1,'2026-12-02',NULL,'2026-11-18 09:12:25','2026-11-18 09:12:25'),(12,366,'Anas','918592873809',1,'ufs',1,'test','[Biometrics / Medicals] Immigration Request: s','Official request received on 2026-11-18. Due date: 2026-12-02. Notes: Respond before deadline.',502,'Priya Sharma',70,'Administrator',1,1,'2026-12-02','2026-11-24 13:33:32','2026-11-18 09:21:11','2026-11-24 08:03:32'),(13,862,'UFS Technologies','+911234231313',1,'ufs',1,'test','[Additional Documents] Immigration Request: u','Official request received on 2026-11-23. Due date: 2026-12-07. Notes: Respond before deadline.',132,'Deepa Nair',132,'Deepa Nair',1,1,'2026-12-07','2026-11-23 13:07:12','2026-11-23 07:34:28','2026-11-23 07:37:12'),(14,864,'Riju Sabu','+918592891322',1,'ufs',1,'test','12','1',70,'Administrator',70,'Administrator',1,0,NULL,'2026-11-24 15:46:02','2026-11-24 08:08:34','2026-11-24 10:16:02'),(15,865,'tdd','+911234233232',1,'ufs',1,'test','23','234r',132,'Deepa Nair',70,'Administrator',1,0,NULL,'2026-11-25 13:18:34','2026-11-25 07:48:29','2026-11-25 07:48:34');
/*!40000 ALTER TABLE `contact_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_work_experiences`
--

DROP TABLE IF EXISTS `contact_work_experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_work_experiences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `employer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `experience` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_work_exp_contact` (`contact_id`),
  KEY `idx_work_exp_business` (`business_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `contact_work_experiences_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_work_experiences_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_work_experiences_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_work_experiences`
--

LOCK TABLES `contact_work_experiences` WRITE;
/*!40000 ALTER TABLE `contact_work_experiences` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_work_experiences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `email` varchar(255) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `opted_in` tinyint(1) DEFAULT '0',
  `opt_in_date` timestamp NULL DEFAULT NULL,
  `opt_out_date` timestamp NULL DEFAULT NULL,
  `opt_in_source` enum('manual','link','whatsapp','import') DEFAULT 'manual',
  `channel_id` int DEFAULT NULL,
  `channel_preference` varchar(100) DEFAULT 'whatsapp',
  `has_unread_wa` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_to` int DEFAULT NULL,
  `address` text,
  `enquiry_for_id` int DEFAULT NULL,
  `loss_reason` varchar(255) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `follow_up_count` int DEFAULT '0',
  `follow_up_date` date DEFAULT NULL,
  `follow_up` tinyint(1) DEFAULT '0',
  `sale_won` tinyint(1) DEFAULT '0',
  `sale_won_date` datetime DEFAULT NULL,
  `sale_won_by` int DEFAULT NULL,
  `sale_lost` tinyint(1) DEFAULT '0',
  `sale_lost_date` datetime DEFAULT NULL,
  `sale_lost_by` int DEFAULT NULL,
  `created_by_user` int DEFAULT NULL,
  `user_list` json DEFAULT NULL,
  `priority` enum('High','Medium','Low') DEFAULT NULL,
  `probability_id` int DEFAULT NULL,
  `current_sale_status` int DEFAULT '0',
  `student_basic_profile` text,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `fk_contacts_assigned_to` (`assigned_to`),
  KEY `fk_contacts_enquiry_for` (`enquiry_for_id`),
  KEY `fk_contacts_probability` (`probability_id`),
  KEY `fk_contacts_channel` (`channel_id`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `fk_contacts_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contacts_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contacts_enquiry_for` FOREIGN KEY (`enquiry_for_id`) REFERENCES `enquiry_fors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contacts_probability` FOREIGN KEY (`probability_id`) REFERENCES `probabilities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=877 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (738,1,'Anil Paul','918086041647','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2025-10-20 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',2,'2026-11-26',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(739,1,'Christy Thomas','917012759032','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-10-22 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',7,'2026-11-27',1,1,'2026-11-27 12:38:11',502,0,NULL,NULL,70,'[502, \"132\", \"131\"]',NULL,NULL,1,'test 12333'),(740,1,'Mereena Sebastian','918593949792','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-10-23 18:30:00',502,'Manickamangalam',NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',3,'2026-12-01',1,1,'2026-11-27 12:39:38',502,0,NULL,NULL,70,'[502]',NULL,NULL,1,NULL),(741,1,'Arya Unni','919207455251','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2025-10-24 18:30:00',502,'Okkal',NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',2,'2026-11-27',1,1,'2026-11-27 12:38:39',502,0,NULL,NULL,70,'[502]',NULL,NULL,1,NULL),(742,1,'Anju Shaibu','919207029389','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2025-10-24 18:30:00',131,'Neeleeswaram',NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',2,'2026-11-26',1,1,'2026-11-26 13:01:37',131,0,NULL,NULL,70,'[502, \"131\"]',NULL,NULL,1,NULL),(743,1,'Mathews P Cheriyan','918330029196','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2025-10-24 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',2,'2026-11-30',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(744,1,'Melvin Michael','918606039481','+91',NULL,'[]',0,NULL,NULL,'import',9,'New Call',0,'2025-10-24 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(745,1,'Stefin Father','918921288868','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2025-11-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(746,1,'Alisha Jose','919946627099','+91',NULL,'[]',0,NULL,NULL,'import',9,'New Call',0,'2025-11-06 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',3,'2026-11-19',1,1,'2026-11-26 13:05:44',132,0,NULL,NULL,70,'[502, \"131\", \"132\"]',NULL,NULL,1,NULL),(747,1,'Dona Mary Davis','916238275944','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-11-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(748,1,'Anna K Thomas','919544369627','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-11-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(749,1,'Albin Nixon','919072633714','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2025-11-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(750,1,'Amal Krishna Pradeep','918075410272','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-11-10 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(751,1,'Christo','919745725409','+91',NULL,'[]',0,NULL,NULL,'import',10,'Reference Walkin',0,'2025-11-17 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(752,1,'Anto','917025582957','+91',NULL,'[]',0,NULL,NULL,'import',10,'Reference Walkin',0,'2025-11-17 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(753,1,'Saju (Wife Soumya)','919605351939','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-11-21 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(754,1,'Akhila','919846398306','+91',NULL,'[]',0,NULL,NULL,'import',9,'New Call',0,'2025-11-24 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(755,1,'Jelin','917025787305','+91',NULL,'[]',0,NULL,NULL,'import',9,'New Call',0,'2025-11-30 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(756,1,'Jithin Kunjumon','917306876153','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-11-30 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(757,1,'Albin Mathew','917736804609','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-12-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(758,1,'Avitha','917034214892','+91',NULL,'[]',0,NULL,NULL,'import',9,'New Call',0,'2025-12-03 18:30:00',502,'Thrissur',NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(759,1,'Nithul Biju','919947107688','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-12-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(760,1,'Aldrin Wilson','918590960749','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2025-12-12 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(761,1,'Jomel P Sasi','919746802512','+91',NULL,'[]',0,NULL,NULL,'import',10,'Reference Walkin',0,'2025-12-16 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(762,1,'Midhu','917510720372','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-12-18 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(763,1,'Bibin Baby','918891301607','+91',NULL,'[]',0,NULL,NULL,'import',9,'New Call',0,'2025-12-18 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(764,1,'Nithin','916235054380','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-12-28 18:30:00',502,'Chalakudy',NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(765,1,'Pournamy V S','919947953642','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2025-12-31 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(766,1,'Jithin','917559936024','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2026-01-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(767,1,'Alan M V','918714368015','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2026-01-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(768,1,'Veronica K','917902790819','+91',NULL,'[]',0,NULL,NULL,'import',11,'Instagram AD',0,'2026-01-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(769,1,'Swetha Reji','917356100242','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2026-01-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(770,1,'Kishore','918281882297','+91',NULL,'[]',0,NULL,NULL,'import',10,'Reference Walkin',0,'2026-01-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(771,1,'Alen Sabu','917907699924','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2026-01-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',11,'Application Drafted',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(772,1,'Reshmy','919946623909','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2026-01-07 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(773,1,'Simil Benny','918139014854','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2026-01-08 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0,NULL),(774,1,'Jeswin Shaju','916238139781','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2026-01-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',2,'2026-11-19',1,1,'2026-11-26 17:16:31',502,0,NULL,NULL,70,'[502, 131]',NULL,NULL,1,NULL),(775,1,'Parvathy Poulouse','919562629824','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2026-01-10 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(776,1,'Ann Mariya Devassy','919207393002','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-01-31 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(777,1,'Mariya','917025652243','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-01 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(778,1,'Parvathy','918075421319','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-02 18:30:00',507,NULL,NULL,NULL,2,'test',2,'rw',13,'Lost / Diverted',2,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131, \"507\"]',NULL,NULL,0,NULL),(779,1,'Alex Babu','917306760857','+91',NULL,'[]',0,NULL,NULL,'import',8,'Call Walkin',0,'2026-02-03 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',12,'Follow Up',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(780,1,'Jisiya','919544075107','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-04 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',8,'Decision Pending',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(781,1,'Athul Roy','919745824639','+91',NULL,'[]',0,NULL,NULL,'import',7,'Direct Walkin',0,'2026-02-05 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(782,1,'Festin Francis','918136847799','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-06 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',8,'Decision Pending',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(783,1,'Arjun Saji','917907970712','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-07 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(784,1,'Amal Eldhose','919656917369','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-08 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(785,1,'Sujay Anil','916238921929','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-09 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(786,1,'Antonio','919995136859','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-10 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(787,1,'Shahin','917293043123','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-11 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(788,1,'Adarsh','917561806345','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-12 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(789,1,'Nash A O','919207053054','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-13 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(790,1,'Reebish Santhosh','919995259776','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-14 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(791,1,'Aparna Alias','918590470630','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-15 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(792,1,'Nibin John','918089634476','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-02-28 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(793,1,'Nakul Gopinath','918848528025','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-03-01 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(794,1,'Eldho George','919496336332','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-03-02 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(795,1,'Josiya','918157085147','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-03-03 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',10,'Visa Stage',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(796,1,'Neena Mathew','918111938061','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-03-04 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(797,1,'Dhiya Rose','917356749374','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-03-05 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(798,1,'Sherine Shaju','917736097450','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-03-31 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(799,1,'Renjith T.A','917994242294','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-04-01 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(800,1,'Charles George','916235928027','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-04-02 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(801,1,'John Peter','918921319217','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-04-03 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(802,1,'Akash','918985964850','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-04-04 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(803,1,'Silpa','918921588848','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-04-05 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(804,1,'Maria Rose Joy','916238199308','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-04-30 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(805,1,'Sujil Mathew','919495539298','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-01 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(806,1,'Sanju Sabu','919946613952','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-02 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(807,1,'Jerin Joy','917306072036','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-03 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(808,1,'Dini K Davis','919947343239','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-04 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(809,1,'Emmanuel Xavier','919188105919','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-05 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(810,1,'Anette Joy','918848922735','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-06 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(811,1,'Christal Biju','918606074191','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-07 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(812,1,'Tom Sebastian','917594914948','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-08 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',8,'Decision Pending',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(813,1,'Athul Pramond','918089994154','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-09 18:30:00',131,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 131]',NULL,NULL,0,NULL),(814,1,'Mohammed Shanif','917561034827','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-10 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(815,1,'Alen Mathew Paul','918129195563','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-11 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(816,1,'Anjana Suku','919995117694','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-12 18:30:00',132,'Georgia',NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(817,1,'Devika PV','917736241897','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-13 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(818,1,'Ananthu MK','918075531696','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-14 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(819,1,'Mebin Benny','917510151304','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-15 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(820,1,'Sanjay Krishna','919486711487','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-16 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(821,1,'Jezebel Merlin','919995366699','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-05-31 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(822,1,'Grace Helen','916235681421','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-01 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(823,1,'Dinu Denny','916282373018','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-02 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(824,1,'Mariya Sony','919744467561','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-03 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',10,'Visa Stage',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(825,1,'Aleena Biju','917025486201','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-04 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(826,1,'Benjammin Benny','917306480425','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-05 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(827,1,'Prince Cleetus','916238719423','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-06 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(828,1,'Heaven Christo','919567715403','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-07 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(829,1,'Darsana C.S','919562941995','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-06-30 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(830,1,'Andriya Baby','918848918012','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-01 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(831,1,'Denil K Thoman','919447015393','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-03 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(832,1,'Ananya Shijo','919142131108','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-04 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(833,1,'John Saju','918590499317','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-05 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(834,1,'Gaius Rajan','919447362491','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-06 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(835,1,'Wilston P Wilson','917736412437','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-07 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(836,1,'Niya Tomy','918547736939','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-08 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(837,1,'Sial P Raju','919961108841','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-09 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(838,1,'Sanoop Babu','917306028646','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-10 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(839,1,'Jerin Joy','919633270255','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-07-11 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(840,1,'Dhanya Louis','919946980757','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-08-31 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(841,1,'Aswin Shaji','916282704096','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-01 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(842,1,'Rose Mary Benny','916235768247','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-02 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(843,1,'Sneha Mary Varghese','917028713469','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-03 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(844,1,'Libin Joseph','918281065205','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-04 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(845,1,'Abhiesk A','919633785881','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-05 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(846,1,'Kavya Murali','918590337710','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-06 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(847,1,'Tinu Yohannan','918606019562','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-07 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(848,1,'Namrutha P','919544758662','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-08 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(849,1,'Mary Anjana Antony','919061660862','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-09 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(850,1,'Akshay Rajendran','919207926995','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-10 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(851,1,'Dibin Biju','919846079560','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-11 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(852,1,'Denil Joy','918304010349','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-12 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(853,1,'Aparna V','919061433009','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-13 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(854,1,'Melissa Jaiby','916363689904','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-14 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(855,1,'Balamuralikrishna','919746380879','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-15 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(856,1,'Nandana Surendran','918086836374','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-16 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',2,'2026-11-27',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(857,1,'Albin Reji','919995154072','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-17 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',2,'2026-11-27',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(858,1,'Abhijith Siju','918943391979','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-18 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',1,'2026-11-19',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(859,1,'Anas','918592873809','+91',NULL,'[]',0,NULL,NULL,'import',12,'Unknown',0,'2026-09-19 18:30:00',132,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',3,'2026-11-30',1,0,NULL,NULL,0,NULL,NULL,70,'[502, 132]',NULL,NULL,0,NULL),(864,1,'Riju Sabu','+918592891322','+91',NULL,'[\"lead\"]',0,NULL,NULL,'manual',NULL,'whatsapp',0,'2026-11-23 12:08:31',132,NULL,NULL,NULL,1,'ufs',1,'test',8,'Decision Pending',3,'2026-11-27',1,0,NULL,NULL,0,NULL,NULL,131,'[131, 132]',NULL,NULL,0,'test'),(866,1,'Nandan Babu','+918129025108','+91',NULL,'[\"lead\"]',0,NULL,NULL,'manual',NULL,'whatsapp',0,'2026-11-27 05:00:37',507,NULL,NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-11-27',1,1,'2026-11-27 10:30:37',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(867,1,'Rahul Varma','919847100001','+91','rahul.varma@example.com','[\"UK\", \"Postgraduate\"]',0,NULL,NULL,'import',13,'Website',0,'2026-12-05 00:00:00',507,'Kochi, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-05',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(868,1,'Sneha Nair','919847100002','+91','sneha.nair@example.com','[\"IELTS\", \"Fast Track\"]',0,NULL,NULL,'import',14,'Instagram',0,'2026-12-06 00:00:00',507,'Trivandrum, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-06',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(869,1,'Arun Kumar','919847100003','+91','arun.kumar@example.com','[\"Canada\", \"Work Permit\"]',0,NULL,NULL,'import',15,'Facebook',0,'2026-12-07 00:00:00',507,'Calicut, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-07',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(870,1,'Anjali Menon','919847100004','+91','anjali.menon@example.com','[\"Australia\", \"Nursing\"]',0,NULL,NULL,'import',16,'WhatsApp',0,'2026-12-08 00:00:00',507,'Thrissur, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-08',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(871,1,'Faisal Mohammed','919847100005','+91','faisal.m@example.com','[\"Germany\", \"Masters\"]',0,NULL,NULL,'import',17,'Referral',0,'2026-12-09 00:00:00',507,'Malappuram, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-09',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(872,1,'Divya Pillai','919847100006','+91','divya.pillai@example.com','[\"PTE\", \"Academic\"]',0,NULL,NULL,'import',18,'Walk-in',0,'2026-12-10 00:00:00',507,'Kottayam, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-10',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(873,1,'George Thomas','919847100007','+91','george.t@example.com','[\"Ireland\", \"IT\"]',0,NULL,NULL,'import',19,'Google Ads',0,'2026-12-11 00:00:00',507,'Kollam, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-11',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(874,1,'Meera Krishnan','919847100008','+91','meera.k@example.com','[\"UK\", \"Healthcare\"]',0,NULL,NULL,'import',20,'LinkedIn',0,'2026-12-12 00:00:00',507,'Palakkad, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-12',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(875,1,'Sanjay Das','919847100009','+91','sanjay.das@example.com','[\"USA\", \"Engineering\"]',0,NULL,NULL,'import',21,'Education Fair',0,'2026-12-13 00:00:00',507,'Kannur, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-13',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL),(876,1,'Ritu Sharma','919847100010','+91','ritu.sharma@example.com','[\"Schengen\", \"Visit\"]',0,NULL,NULL,'import',22,'Direct Call',0,'2026-12-14 00:00:00',507,'Alappuzha, Kerala',NULL,NULL,2,'test',2,'rw',9,'Application Submitted',0,'2026-12-14',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,131,'[131, 507]',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts_backup_deleted`
--

DROP TABLE IF EXISTS `contacts_backup_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts_backup_deleted` (
  `id` int NOT NULL DEFAULT '0',
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `email` varchar(255) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `opted_in` tinyint(1) DEFAULT '0',
  `opt_in_date` timestamp NULL DEFAULT NULL,
  `opt_out_date` timestamp NULL DEFAULT NULL,
  `opt_in_source` enum('manual','link','whatsapp','import') DEFAULT 'manual',
  `channel_id` int DEFAULT NULL,
  `channel_preference` varchar(100) DEFAULT 'whatsapp',
  `has_unread_wa` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_to` int DEFAULT NULL,
  `address` text,
  `enquiry_for_id` int DEFAULT NULL,
  `loss_reason` varchar(255) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `follow_up_count` int DEFAULT '0',
  `follow_up_date` date DEFAULT NULL,
  `follow_up` tinyint(1) DEFAULT '0',
  `sale_won` tinyint(1) DEFAULT '0',
  `sale_won_date` datetime DEFAULT NULL,
  `sale_won_by` int DEFAULT NULL,
  `sale_lost` tinyint(1) DEFAULT '0',
  `sale_lost_date` datetime DEFAULT NULL,
  `sale_lost_by` int DEFAULT NULL,
  `created_by_user` int DEFAULT NULL,
  `user_list` json DEFAULT NULL,
  `priority` enum('High','Medium','Low') DEFAULT NULL,
  `probability_id` int DEFAULT NULL,
  `current_sale_status` int DEFAULT '0',
  `student_basic_profile` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts_backup_deleted`
--

LOCK TABLES `contacts_backup_deleted` WRITE;
/*!40000 ALTER TABLE `contacts_backup_deleted` DISABLE KEYS */;
INSERT INTO `contacts_backup_deleted` VALUES (862,1,'UFS Technologies','+914567890234','+91',NULL,'[\"lead\"]',0,NULL,NULL,'manual',NULL,'whatsapp',0,'2026-11-23 07:29:48',132,NULL,NULL,NULL,1,'ufs',1,'test',12,'Follow Up',3,'2026-11-27',1,0,NULL,NULL,0,NULL,NULL,132,'[132]',NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `contacts_backup_deleted` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `channel` varchar(100) DEFAULT 'whatsapp',
  `status` enum('open','resolved','pending') DEFAULT 'open',
  `assigned_to` int DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `social_account_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `fk_conversations_social_account` (`social_account_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`),
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_conversations_social_account` FOREIGN KEY (`social_account_id`) REFERENCES `social_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `country_codes`
--

DROP TABLE IF EXISTS `country_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `iso_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_length` int DEFAULT '10',
  `min_length` int DEFAULT '7',
  `max_length` int DEFAULT '15',
  `flag_emoji` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `is_default` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '100',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_country_iso` (`country_name`,`iso_code`),
  KEY `idx_code` (`country_code`),
  KEY `idx_iso` (`iso_code`),
  KEY `idx_sort` (`sort_order`,`country_name`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `country_codes`
--

LOCK TABLES `country_codes` WRITE;
/*!40000 ALTER TABLE `country_codes` DISABLE KEYS */;
INSERT INTO `country_codes` VALUES (1,'India','+91','IN',10,10,10,'??',1,1,'2026-11-18 04:16:42'),(2,'United States','+1','US',10,10,10,'??',0,2,'2026-11-18 04:16:42'),(3,'United Kingdom','+44','GB',10,9,10,'??',0,3,'2026-11-18 04:16:42'),(4,'Canada','+1','CA',10,10,10,'??',0,4,'2026-11-18 04:16:42'),(5,'Australia','+61','AU',9,9,9,'??',0,5,'2026-11-18 04:16:42'),(6,'New Zealand','+64','NZ',9,8,10,'??',0,6,'2026-11-18 04:16:42'),(7,'United Arab Emirates','+971','AE',9,9,9,'??',0,7,'2026-11-18 04:16:42'),(8,'Saudi Arabia','+966','SA',9,9,9,'??',0,8,'2026-11-18 04:16:42'),(9,'Singapore','+65','SG',8,8,8,'??',0,9,'2026-11-18 04:16:42'),(10,'Germany','+49','DE',10,10,11,'??',0,10,'2026-11-18 04:16:42'),(11,'Ireland','+353','IE',9,9,9,'??',0,11,'2026-11-18 04:16:42'),(12,'Malaysia','+60','MY',10,9,10,'??',0,12,'2026-11-18 04:16:42'),(13,'Qatar','+974','QA',8,8,8,'??',0,13,'2026-11-18 04:16:42'),(14,'Kuwait','+965','KW',8,8,8,'??',0,14,'2026-11-18 04:16:42'),(15,'Oman','+968','OM',8,8,8,'??',0,15,'2026-11-18 04:16:42'),(16,'Bahrain','+973','BH',8,8,8,'??',0,16,'2026-11-18 04:16:43'),(17,'Afghanistan','+93','AF',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(18,'Albania','+355','AL',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(19,'Algeria','+213','DZ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(20,'American Samoa','+1684','AS',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(21,'Andorra','+376','AD',6,6,9,'??',0,100,'2026-11-18 04:16:43'),(22,'Angola','+244','AO',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(23,'Anguilla','+1264','AI',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(24,'Antarctica','+672','AQ',6,6,6,'??',0,100,'2026-11-18 04:16:43'),(25,'Antigua and Barbuda','+1268','AG',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(26,'Argentina','+54','AR',10,10,11,'??',0,100,'2026-11-18 04:16:43'),(27,'Armenia','+374','AM',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(28,'Aruba','+297','AW',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(29,'Austria','+43','AT',10,4,13,'??',0,100,'2026-11-18 04:16:43'),(30,'Azerbaijan','+994','AZ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(31,'Bahamas','+1242','BS',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(32,'Bangladesh','+880','BD',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(33,'Barbados','+1246','BB',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(34,'Belarus','+375','BY',9,9,10,'??',0,100,'2026-11-18 04:16:43'),(35,'Belgium','+32','BE',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(36,'Belize','+501','BZ',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(37,'Benin','+229','BJ',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(38,'Bermuda','+1441','BM',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(39,'Bhutan','+975','BT',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(40,'Bolivia','+591','BO',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(41,'Bosnia and Herzegovina','+387','BA',8,8,9,'??',0,100,'2026-11-18 04:16:43'),(42,'Botswana','+267','BW',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(43,'Brazil','+55','BR',11,10,11,'??',0,100,'2026-11-18 04:16:43'),(44,'British Indian Ocean Territory','+246','IO',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(45,'British Virgin Islands','+1284','VG',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(46,'Brunei','+673','BN',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(47,'Bulgaria','+359','BG',9,7,9,'??',0,100,'2026-11-18 04:16:43'),(48,'Burkina Faso','+226','BF',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(49,'Burundi','+257','BI',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(50,'Cambodia','+855','KH',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(51,'Cameroon','+237','CM',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(52,'Cape Verde','+238','CV',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(53,'Caribbean Netherlands','+599','BQ',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(54,'Cayman Islands','+1345','KY',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(55,'Central African Republic','+236','CF',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(56,'Chad','+235','TD',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(57,'Chile','+56','CL',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(58,'China','+86','CN',11,11,11,'??',0,100,'2026-11-18 04:16:43'),(59,'Christmas Island','+61','CX',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(60,'Cocos (Keeling) Islands','+61','CC',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(61,'Colombia','+57','CO',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(62,'Comoros','+269','KM',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(63,'Congo','+242','CG',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(64,'Congo (Democratic Republic)','+243','CD',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(65,'Cook Islands','+682','CK',5,5,5,'??',0,100,'2026-11-18 04:16:43'),(66,'Costa Rica','+506','CR',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(67,'Croatia','+385','HR',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(68,'Cuba','+53','CU',8,6,8,'??',0,100,'2026-11-18 04:16:43'),(69,'Curaçao','+599','CW',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(70,'Cyprus','+357','CY',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(71,'Czech Republic','+420','CZ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(72,'Denmark','+45','DK',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(73,'Djibouti','+253','DJ',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(74,'Dominica','+1767','DM',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(75,'Dominican Republic','+1809','DO',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(76,'Ecuador','+593','EC',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(77,'Egypt','+20','EG',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(78,'El Salvador','+503','SV',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(79,'Equatorial Guinea','+240','GQ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(80,'Eritrea','+291','ER',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(81,'Estonia','+372','EE',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(82,'Eswatini','+268','SZ',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(83,'Ethiopia','+251','ET',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(84,'Falkland Islands','+500','FK',5,5,5,'??',0,100,'2026-11-18 04:16:43'),(85,'Faroe Islands','+298','FO',6,6,6,'??',0,100,'2026-11-18 04:16:43'),(86,'Fiji','+679','FJ',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(87,'Finland','+358','FI',9,5,12,'??',0,100,'2026-11-18 04:16:43'),(88,'France','+33','FR',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(89,'French Guiana','+594','GF',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(90,'French Polynesia','+689','PF',8,6,8,'??',0,100,'2026-11-18 04:16:43'),(91,'Gabon','+241','GA',7,7,8,'??',0,100,'2026-11-18 04:16:43'),(92,'Gambia','+220','GM',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(93,'Georgia','+995','GE',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(94,'Ghana','+233','GH',9,9,10,'??',0,100,'2026-11-18 04:16:43'),(95,'Gibraltar','+350','GI',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(96,'Greece','+30','GR',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(97,'Greenland','+299','GL',6,6,6,'??',0,100,'2026-11-18 04:16:43'),(98,'Grenada','+1473','GD',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(99,'Guadeloupe','+590','GP',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(100,'Guam','+1671','GU',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(101,'Guatemala','+502','GT',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(102,'Guernsey','+44','GG',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(103,'Guinea','+224','GN',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(104,'Guinea-Bissau','+245','GW',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(105,'Guyana','+592','GY',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(106,'Haiti','+509','HT',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(107,'Honduras','+504','HN',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(108,'Hong Kong','+852','HK',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(109,'Hungary','+36','HU',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(110,'Iceland','+354','IS',7,7,9,'??',0,100,'2026-11-18 04:16:43'),(111,'Indonesia','+62','ID',10,9,12,'??',0,100,'2026-11-18 04:16:43'),(112,'Iran','+98','IR',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(113,'Iraq','+964','IQ',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(114,'Isle of Man','+44','IM',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(115,'Israel','+972','IL',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(116,'Italy','+39','IT',10,9,11,'??',0,100,'2026-11-18 04:16:43'),(117,'Ivory Coast','+225','CI',10,8,10,'??',0,100,'2026-11-18 04:16:43'),(118,'Jamaica','+1876','JM',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(119,'Japan','+81','JP',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(120,'Jersey','+44','JE',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(121,'Jordan','+962','JO',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(122,'Kazakhstan','+7','KZ',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(123,'Kenya','+254','KE',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(124,'Kiribati','+686','KI',5,5,8,'??',0,100,'2026-11-18 04:16:43'),(125,'Kosovo','+383','XK',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(126,'Kyrgyzstan','+996','KG',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(127,'Laos','+856','LA',9,8,10,'??',0,100,'2026-11-18 04:16:43'),(128,'Latvia','+371','LV',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(129,'Lebanon','+961','LB',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(130,'Lesotho','+266','LS',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(131,'Liberia','+231','LR',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(132,'Libya','+218','LY',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(133,'Liechtenstein','+423','LI',7,7,9,'??',0,100,'2026-11-18 04:16:43'),(134,'Lithuania','+370','LT',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(135,'Luxembourg','+352','LU',9,8,11,'??',0,100,'2026-11-18 04:16:43'),(136,'Macao','+853','MO',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(137,'Madagascar','+261','MG',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(138,'Malawi','+265','MW',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(139,'Maldives','+960','MV',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(140,'Mali','+223','ML',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(141,'Malta','+356','MT',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(142,'Marshall Islands','+692','MH',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(143,'Martinique','+596','MQ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(144,'Mauritania','+222','MR',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(145,'Mauritius','+230','MU',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(146,'Mayotte','+262','YT',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(147,'Mexico','+52','MX',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(148,'Micronesia','+691','FM',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(149,'Moldova','+373','MD',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(150,'Monaco','+377','MC',8,8,9,'??',0,100,'2026-11-18 04:16:43'),(151,'Mongolia','+976','MN',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(152,'Montenegro','+382','ME',8,8,9,'??',0,100,'2026-11-18 04:16:43'),(153,'Montserrat','+1664','MS',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(154,'Morocco','+212','MA',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(155,'Mozambique','+258','MZ',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(156,'Myanmar','+95','MM',9,7,10,'??',0,100,'2026-11-18 04:16:43'),(157,'Namibia','+264','NA',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(158,'Nauru','+674','NR',7,4,7,'??',0,100,'2026-11-18 04:16:43'),(159,'Nepal','+977','NP',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(160,'Netherlands','+31','NL',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(161,'New Caledonia','+687','NC',6,6,6,'??',0,100,'2026-11-18 04:16:43'),(162,'Nicaragua','+505','NI',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(163,'Niger','+227','NE',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(164,'Nigeria','+234','NG',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(165,'Niue','+683','NU',4,4,4,'??',0,100,'2026-11-18 04:16:43'),(166,'Norfolk Island','+672','NF',6,5,6,'??',0,100,'2026-11-18 04:16:43'),(167,'North Korea','+850','KP',10,6,17,'??',0,100,'2026-11-18 04:16:43'),(168,'North Macedonia','+389','MK',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(169,'Northern Mariana Islands','+1670','MP',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(170,'Norway','+47','NO',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(171,'Pakistan','+92','PK',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(172,'Palau','+680','PW',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(173,'Palestine','+970','PS',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(174,'Panama','+507','PA',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(175,'Papua New Guinea','+675','PG',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(176,'Paraguay','+595','PY',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(177,'Peru','+51','PE',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(178,'Philippines','+63','PH',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(179,'Poland','+48','PL',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(180,'Portugal','+351','PT',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(181,'Puerto Rico','+1787','PR',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(182,'Reunion','+262','RE',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(183,'Romania','+40','RO',10,9,10,'??',0,100,'2026-11-18 04:16:43'),(184,'Russia','+7','RU',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(185,'Rwanda','+250','RW',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(186,'Saint Barthélemy','+590','BL',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(187,'Saint Helena','+290','SH',4,4,4,'??',0,100,'2026-11-18 04:16:43'),(188,'Saint Kitts and Nevis','+1869','KN',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(189,'Saint Lucia','+1758','LC',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(190,'Saint Martin','+590','MF',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(191,'Saint Pierre and Miquelon','+508','PM',6,6,6,'??',0,100,'2026-11-18 04:16:43'),(192,'Saint Vincent and the Grenadines','+1784','VC',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(193,'Samoa','+685','WS',7,5,7,'??',0,100,'2026-11-18 04:16:43'),(194,'San Marino','+378','SM',10,6,10,'??',0,100,'2026-11-18 04:16:43'),(195,'Sao Tome and Principe','+239','ST',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(196,'Senegal','+221','SN',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(197,'Serbia','+381','RS',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(198,'Seychelles','+248','SC',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(199,'Sierra Leone','+232','SL',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(200,'Sint Maarten','+1721','SX',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(201,'Slovakia','+421','SK',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(202,'Slovenia','+386','SI',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(203,'Solomon Islands','+677','SB',7,5,7,'??',0,100,'2026-11-18 04:16:43'),(204,'Somalia','+252','SO',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(205,'South Africa','+27','ZA',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(206,'South Korea','+82','KR',10,8,11,'??',0,100,'2026-11-18 04:16:43'),(207,'South Sudan','+211','SS',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(208,'Spain','+34','ES',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(209,'Sri Lanka','+94','LK',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(210,'Sudan','+249','SD',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(211,'Suriname','+597','SR',7,6,7,'??',0,100,'2026-11-18 04:16:43'),(212,'Svalbard and Jan Mayen','+47','SJ',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(213,'Sweden','+46','SE',9,7,13,'??',0,100,'2026-11-18 04:16:43'),(214,'Switzerland','+41','CH',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(215,'Syria','+963','SY',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(216,'Taiwan','+886','TW',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(217,'Tajikistan','+992','TJ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(218,'Tanzania','+255','TZ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(219,'Thailand','+66','TH',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(220,'Timor-Leste','+670','TL',8,7,8,'??',0,100,'2026-11-18 04:16:43'),(221,'Togo','+228','TG',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(222,'Tokelau','+690','TK',4,4,4,'??',0,100,'2026-11-18 04:16:43'),(223,'Tonga','+676','TO',5,5,7,'??',0,100,'2026-11-18 04:16:43'),(224,'Trinidad and Tobago','+1868','TT',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(225,'Tunisia','+216','TN',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(226,'Turkey','+90','TR',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(227,'Turkmenistan','+993','TM',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(228,'Turks and Caicos Islands','+1649','TC',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(229,'Tuvalu','+688','TV',5,5,6,'??',0,100,'2026-11-18 04:16:43'),(230,'Uganda','+256','UG',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(231,'Ukraine','+380','UA',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(232,'United States Virgin Islands','+1340','VI',7,7,7,'??',0,100,'2026-11-18 04:16:43'),(233,'Uruguay','+598','UY',8,8,8,'??',0,100,'2026-11-18 04:16:43'),(234,'Uzbekistan','+998','UZ',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(235,'Vanuatu','+678','VU',7,5,7,'??',0,100,'2026-11-18 04:16:43'),(236,'Vatican City','+379','VA',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(237,'Venezuela','+58','VE',10,10,10,'??',0,100,'2026-11-18 04:16:43'),(238,'Vietnam','+84','VN',10,9,10,'??',0,100,'2026-11-18 04:16:43'),(239,'Wallis and Futuna','+681','WF',6,6,6,'??',0,100,'2026-11-18 04:16:43'),(240,'Western Sahara','+212','EH',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(241,'Yemen','+967','YE',9,8,9,'??',0,100,'2026-11-18 04:16:43'),(242,'Zambia','+260','ZM',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(243,'Zimbabwe','+263','ZW',9,9,9,'??',0,100,'2026-11-18 04:16:43'),(244,'Åland Islands','+358','AX',9,6,10,'??',0,100,'2026-11-18 04:16:43');
/*!40000 ALTER TABLE `country_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'vdv',234567.00,NULL,NULL,'2026-11-18 08:25:02','2026-11-18 08:25:02');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_help_videos`
--

DROP TABLE IF EXISTS `crm_help_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_help_videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'CRM Workflow & Tutorial Guide',
  `description` text,
  `video_url` varchar(1000) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_help_biz` (`business_id`),
  CONSTRAINT `crm_help_videos_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `crm_help_videos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_help_videos`
--

LOCK TABLES `crm_help_videos` WRITE;
/*!40000 ALTER TABLE `crm_help_videos` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_help_videos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctwa_clicks`
--

DROP TABLE IF EXISTS `ctwa_clicks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctwa_clicks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link_id` int DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `referrer` varchar(500) DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `link_id` (`link_id`),
  CONSTRAINT `ctwa_clicks_ibfk_1` FOREIGN KEY (`link_id`) REFERENCES `ctwa_links` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctwa_clicks`
--

LOCK TABLES `ctwa_clicks` WRITE;
/*!40000 ALTER TABLE `ctwa_clicks` DISABLE KEYS */;
/*!40000 ALTER TABLE `ctwa_clicks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctwa_links`
--

DROP TABLE IF EXISTS `ctwa_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctwa_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `pre_filled_message` text,
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `short_code` varchar(20) DEFAULT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `click_count` int DEFAULT '0',
  `conversation_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_code` (`short_code`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `ctwa_links_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctwa_links`
--

LOCK TABLES `ctwa_links` WRITE;
/*!40000 ALTER TABLE `ctwa_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `ctwa_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,1,'test',NULL,'2026-11-17 08:30:18','2026-11-17 08:30:18'),(2,2,'rw',NULL,'2026-11-26 11:55:51','2026-11-26 11:55:51');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `designations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `document_types_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drip_campaigns`
--

DROP TABLE IF EXISTS `drip_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drip_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `steps` json DEFAULT NULL,
  `trigger_event` varchar(100) DEFAULT NULL,
  `trigger_tags` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `drip_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drip_campaigns`
--

LOCK TABLES `drip_campaigns` WRITE;
/*!40000 ALTER TABLE `drip_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `drip_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drip_enrollments`
--

DROP TABLE IF EXISTS `drip_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drip_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `current_step` int DEFAULT '0',
  `next_send_at` timestamp NULL DEFAULT NULL,
  `status` enum('active','completed','stopped') DEFAULT 'active',
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `campaign_id` (`campaign_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `drip_enrollments_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `drip_campaigns` (`id`),
  CONSTRAINT `drip_enrollments_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drip_enrollments`
--

LOCK TABLES `drip_enrollments` WRITE;
/*!40000 ALTER TABLE `drip_enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `drip_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_for_options`
--

DROP TABLE IF EXISTS `enquiry_for_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiry_for_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `enquiry_for_options_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_for_options`
--

LOCK TABLES `enquiry_for_options` WRITE;
/*!40000 ALTER TABLE `enquiry_for_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_for_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_fors`
--

DROP TABLE IF EXISTS `enquiry_fors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiry_fors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `enquiry_fors_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_fors`
--

LOCK TABLES `enquiry_fors` WRITE;
/*!40000 ALTER TABLE `enquiry_fors` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_fors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `field_categories`
--

DROP TABLE IF EXISTS `field_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `field_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `field_categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `field_categories`
--

LOCK TABLES `field_categories` WRITE;
/*!40000 ALTER TABLE `field_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `field_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follow_ups`
--

DROP TABLE IF EXISTS `follow_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_ups` (
  `follow_up_id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `entry_date_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `by_user_id` int DEFAULT NULL,
  `by_user_name` varchar(255) DEFAULT NULL,
  `to_user_id` int DEFAULT NULL,
  `to_user_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`follow_up_id`),
  KEY `fk_contact_followup_contact` (`contact_id`),
  CONSTRAINT `fk_contact_followup_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1032 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups`
--

LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
INSERT INTO `follow_ups` VALUES (767,765,'Pournamy V S','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Waiting for documents; still asking for 3rd party arrangement for finance'),(768,766,'Jithin','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test','Application submitted'),(769,767,'Alan M V','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Will come on Monday directly; shared UCOL details, waiting for documents'),(770,768,'Veronica K','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Application moved - waiting for offer letter; not interested'),(771,769,'Swetha Reji','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','Still no reply from candidate'),(772,770,'Kishore','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test','Submitted application to NZSE Masters in Data'),(773,771,'Alen Sabu','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',11,'Application Drafted',1,'ufs',1,'test','Application drafted'),(774,772,'Reshmy','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Aswathy handling - waiting to receive documents'),(775,773,'Simil Benny','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested in Health Care Certificate Program Level 4'),(776,774,'Jeswin Shaju','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested in Health Care Certificate Program Level 5'),(778,776,'Ann Mariya Devassy','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Given for conditional / declined; now given for diploma'),(779,777,'Mariya','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Details shared MBIL & Masters in Business Intelligence; collected all documents'),(780,778,'Parvathy','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',13,'Lost / Diverted',1,'ufs',1,'test','Looking for Germany; not that much interested in NZ'),(781,779,'Alex Babu','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',12,'Follow Up',1,'ufs',1,'test','12th 2021 BioMaths 84%, B.Tech dropped, B.Com 22-25 58%, MBA 2027. NR 21-1 doubts on ITR. Will come on Saturday'),(782,780,'Jisiya','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',8,'Decision Pending',1,'ufs',1,'test','Decision pending'),(783,781,'Athul Roy','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','BA LLB 2023, Safety Officer STED Council, working Doha. NR 16-2, No response 2-6, 24-6 call disconnected'),(784,782,'Festin Francis','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',8,'Decision Pending',1,'ufs',1,'test','Decision pending; fund issue'),(785,783,'Arjun Saji','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Waiting for his update'),(786,784,'Amal Eldhose','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested but needs time to confirm'),(787,785,'Sujay Anil','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Unconditional offer letter received'),(788,786,'Antonio','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','Not responding'),(789,787,'Shahin','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Shared documents, waiting for degree certificate'),(792,790,'Reebish Santhosh','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Course details shared'),(793,791,'Aparna Alias','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Received offer from NZSE'),(794,792,'Nibin John','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Received offer from SIT; still interested in NZSE Addiction Diploma (2 offers received)'),(795,793,'Nakul Gopinath','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Offer letter waiting'),(796,794,'Eldho George','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Back out case - age limit'),(797,795,'Josiya','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',10,'Visa Stage',1,'ufs',1,'test','Offer letter received; waiting for visa submission'),(798,796,'Neena Mathew','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested in MBIL and NZSE; shared details'),(800,798,'Sherine Shaju','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','No response 24-6. 12th 2026 78%, going for IELTS; moved UK with other agency'),(806,804,'Maria Rose Joy','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Moved Australia through other agency'),(807,805,'Sujil Mathew','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Course options shared, not interested'),(808,806,'Sanju Sabu','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Not proceeding to abroad education'),(809,807,'Jerin Joy','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','No response to call'),(810,808,'Dini K Davis','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Not proceeding to abroad education'),(811,809,'Emmanuel Xavier','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(812,810,'Anette Joy','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(813,811,'Christal Biju','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(814,812,'Tom Sebastian','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',8,'Decision Pending',1,'ufs',1,'test','Decision pending'),(815,813,'Athul Pramond','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(818,816,'Anjana Suku','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Country interest: Georgia'),(826,824,'Mariya Sony','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',10,'Visa Stage',1,'ufs',1,'test','Visa proceeding; contacted by Josmi - NZSE'),(842,840,'Dhanya Louis','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Documents not received'),(843,841,'Aswin Shaji','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Offer received'),(859,857,'Albin Reji','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Country interest: Germany'),(860,858,'Abhijith Siju','2026-11-19','2026-11-19 12:59:29',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Country interest: Germany'),(868,864,'Riju Sabu',NULL,'2026-11-23 17:38:31',131,'Rahul Menon',131,'Rahul Menon',8,'Decision Pending',1,'ufs',1,'test','Contact created'),(1006,740,'Mereena Sebastian','2026-11-19','2026-11-26 14:58:35',502,'Priya Sharma',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1007,739,'Christy Thomas','2026-11-19','2026-11-26 15:05:03',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1008,739,'Christy Thomas','2026-11-19','2026-11-26 16:50:09',131,'Rahul Menon',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1009,774,'Jeswin Shaju','2026-11-19','2026-11-26 17:16:30',131,'Rahul Menon',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1010,778,'Parvathy','2026-11-19','2026-11-26 17:28:47',131,'Rahul Menon',507,'reas',13,'Lost / Diverted',2,'test',2,'rw',''),(1011,866,'Nandan Babu','2026-11-27','2026-11-27 10:30:37',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','d'),(1012,867,'Rahul Varma','2026-12-05','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1013,868,'Sneha Nair','2026-12-06','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1014,869,'Arun Kumar','2026-12-07','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1015,870,'Anjali Menon','2026-12-08','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1016,871,'Faisal Mohammed','2026-12-09','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1017,872,'Divya Pillai','2026-12-10','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1018,873,'George Thomas','2026-12-11','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1019,874,'Meera Krishnan','2026-12-12','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1020,875,'Sanjay Das','2026-12-13','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1021,876,'Ritu Sharma','2026-12-14','2026-11-27 11:04:23',131,'Rahul Menon',507,'reas',9,'Application Submitted',2,'test',2,'rw','gr'),(1022,739,'Christy Thomas','2026-11-19','2026-11-27 12:37:49',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1023,739,'Christy Thomas','2026-11-27','2026-11-27 12:38:11',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1024,741,'Arya Unni','2026-11-27','2026-11-27 12:38:39',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1025,740,'Mereena Sebastian','2026-12-01','2026-11-27 12:39:37',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test',''),(1026,743,'Mathews P Cheriyan','2026-11-30','2026-11-27 12:40:02',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test',''),(1027,864,'Riju Sabu','2026-11-27','2026-11-27 13:18:09',70,'Administrator',132,'Deepa Nair',8,'Decision Pending',1,'ufs',1,'test',''),(1028,857,'Albin Reji','2026-11-27','2026-11-27 13:24:47',70,'Administrator',132,'Deepa Nair',2,'In Progress',1,'ufs',1,'test',''),(1029,856,'Nandana Surendran','2026-11-27','2026-11-27 13:24:57',70,'Administrator',132,'Deepa Nair',6,'	Proceeding',1,'ufs',1,'test',''),(1030,859,'Anas','2026-11-28','2026-11-28 10:06:04',70,'Administrator',132,'Deepa Nair',6,'	Proceeding',1,'ufs',1,'test',''),(1031,859,'Anas','2026-11-30','2026-11-28 10:06:29',70,'Administrator',132,'Deepa Nair',6,'	Proceeding',1,'ufs',1,'test','');
/*!40000 ALTER TABLE `follow_ups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follow_ups_backup_deleted`
--

DROP TABLE IF EXISTS `follow_ups_backup_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_ups_backup_deleted` (
  `follow_up_id` int NOT NULL DEFAULT '0',
  `contact_id` int NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `entry_date_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `by_user_id` int DEFAULT NULL,
  `by_user_name` varchar(255) DEFAULT NULL,
  `to_user_id` int DEFAULT NULL,
  `to_user_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `remarks` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups_backup_deleted`
--

LOCK TABLES `follow_ups_backup_deleted` WRITE;
/*!40000 ALTER TABLE `follow_ups_backup_deleted` DISABLE KEYS */;
/*!40000 ALTER TABLE `follow_ups_backup_deleted` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imported_leads`
--

DROP TABLE IF EXISTS `imported_leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imported_leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `import_batch_id` varchar(64) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `tags` json DEFAULT NULL,
  `opt_in_source` varchar(50) DEFAULT 'import',
  `channel_preference` varchar(100) DEFAULT 'whatsapp',
  `channel_id` int DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `enquiry_for_id` int DEFAULT NULL,
  `enquiry_for_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `lead_date` datetime DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `follow_up` tinyint(1) DEFAULT '0',
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `assigned_user_name` varchar(255) DEFAULT NULL,
  `current_sale_status` int DEFAULT '0',
  `sale_won` tinyint(1) DEFAULT '0',
  `sale_won_date` datetime DEFAULT NULL,
  `sale_won_by` int DEFAULT NULL,
  `sale_lost` tinyint(1) DEFAULT '0',
  `sale_lost_date` datetime DEFAULT NULL,
  `sale_lost_by` int DEFAULT NULL,
  `loss_reason` varchar(255) DEFAULT NULL,
  `created_by_user` int DEFAULT NULL,
  `user_list` json DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_imported_leads_biz` (`business_id`),
  KEY `idx_imported_leads_contact` (`contact_id`),
  KEY `idx_imported_leads_phone` (`phone`),
  KEY `idx_imported_leads_batch` (`import_batch_id`),
  CONSTRAINT `fk_imported_leads_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_imported_leads_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=621 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imported_leads`
--

LOCK TABLES `imported_leads` WRITE;
/*!40000 ALTER TABLE `imported_leads` DISABLE KEYS */;
INSERT INTO `imported_leads` VALUES (489,1,738,'batch_1795073369459_j8ftqxd','Anil Paul','918086041647','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-21 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/21/2025\", \"Assigned_To\": \"Unassigned\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anil Paul\", \"Primary_Phone\": 8086041647}','2025-10-20 18:30:00'),(490,1,739,'batch_1795073369459_j8ftqxd','Christy Thomas','917012759032','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-10-23 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/23/2025\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Christy Thomas\", \"Primary_Phone\": 7012759032}','2025-10-22 18:30:00'),(491,1,740,'batch_1795073369459_j8ftqxd','Mereena Sebastian','918593949792','+91',NULL,'Manickamangalam','[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-10-24 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Manickamangalam\", \"Lead_Date\": \"10/24/2025\", \"Assigned_To\": \"Hancy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Mereena Sebastian\", \"Primary_Phone\": 8593949792, \"Qualification\": \"MSW\"}','2025-10-23 18:30:00'),(492,1,741,'batch_1795073369459_j8ftqxd','Arya Unni','919207455251','+91',NULL,'Okkal','[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Okkal\", \"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Arya Unni\", \"Primary_Phone\": 9207455251}','2025-10-24 18:30:00'),(493,1,742,'batch_1795073369459_j8ftqxd','Anju Shaibu','919207029389','+91',NULL,'Neeleeswaram','[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Neeleeswaram\", \"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anju Shaibu\", \"Primary_Phone\": 9207029389}','2025-10-24 18:30:00'),(494,1,743,'batch_1795073369459_j8ftqxd','Mathews P Cheriyan','918330029196','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Mathews P Cheriyan\", \"Primary_Phone\": 8330029196}','2025-10-24 18:30:00'),(495,1,744,'batch_1795073369459_j8ftqxd','Melvin Michael','918606039481','+91',NULL,NULL,'[]','import','New Call',9,'New Call',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Melvin Michael\", \"Primary_Phone\": 8606039481}','2025-10-24 18:30:00'),(496,1,745,'batch_1795073369459_j8ftqxd','Stefin Father','918921288868','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Stefin Father\", \"Primary_Phone\": 8921288868}','2025-11-06 18:30:00'),(497,1,746,'batch_1795073369459_j8ftqxd','Alisha Jose','919946627099','+91',NULL,NULL,'[]','import','New Call',9,'New Call',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Alisha Jose\", \"Primary_Phone\": 9946627099}','2025-11-06 18:30:00'),(498,1,747,'batch_1795073369459_j8ftqxd','Dona Mary Davis','916238275944','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Dona Mary Davis\", \"Primary_Phone\": 6238275944, \"Qualification\": \"12th\"}','2025-11-06 18:30:00'),(499,1,748,'batch_1795073369459_j8ftqxd','Anna K Thomas','919544369627','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Hancy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anna K Thomas\", \"Primary_Phone\": 9544369627, \"Qualification\": \"M.Tech Civil\"}','2025-11-06 18:30:00'),(500,1,749,'batch_1795073369459_j8ftqxd','Albin Nixon','919072633714','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,1,'	New Lead','2025-11-10 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/10/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Albin Nixon\", \"Primary_Phone\": 9072633714}','2025-11-09 18:30:00'),(501,1,750,'batch_1795073369459_j8ftqxd','Amal Krishna Pradeep','918075410272','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-11-11 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/11/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Amal Krishna Pradeep\", \"Primary_Phone\": 8075410272, \"Qualification\": \"B.Tech Mech\"}','2025-11-10 18:30:00'),(502,1,751,'batch_1795073369459_j8ftqxd','Christo','919745725409','+91',NULL,NULL,'[]','import','Reference Walkin',10,'Reference Walkin',NULL,NULL,1,'	New Lead','2025-11-18 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/18/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Christo\", \"Primary_Phone\": 9745725409}','2025-11-17 18:30:00'),(503,1,752,'batch_1795073369459_j8ftqxd','Anto','917025582957','+91',NULL,NULL,'[]','import','Reference Walkin',10,'Reference Walkin',NULL,NULL,1,'	New Lead','2025-11-18 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/18/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anto\", \"Primary_Phone\": 7025582957}','2025-11-17 18:30:00'),(504,1,753,'batch_1795073369459_j8ftqxd','Saju (Wife Soumya)','919605351939','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-11-22 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/22/2025\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Saju (Wife Soumya)\", \"Primary_Phone\": 9605351939, \"Qualification\": \"B.Ed\", \"Secondary_Phone\": 7306233611}','2025-11-21 18:30:00'),(505,1,754,'batch_1795073369459_j8ftqxd','Akhila','919846398306','+91',NULL,NULL,'[]','import','New Call',9,'New Call',NULL,NULL,1,'	New Lead','2025-11-25 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Akhila\", \"Primary_Phone\": 9846398306}','2025-11-24 18:30:00'),(506,1,755,'batch_1795073369459_j8ftqxd','Jelin','917025787305','+91',NULL,NULL,'[]','import','New Call',9,'New Call',NULL,NULL,1,'	New Lead','2025-12-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/1/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Jelin\", \"Primary_Phone\": 7025787305, \"Qualification\": \"MSW\"}','2025-11-30 18:30:00'),(507,1,756,'batch_1795073369459_j8ftqxd','Jithin Kunjumon','917306876153','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-12-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/1/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Jithin Kunjumon\", \"Primary_Phone\": 7306876153}','2025-11-30 18:30:00'),(508,1,757,'batch_1795073369459_j8ftqxd','Albin Mathew','917736804609','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-12-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/2/2025\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Albin Mathew\", \"Primary_Phone\": 7736804609, \"Qualification\": \"12th\"}','2025-12-01 18:30:00'),(509,1,758,'batch_1795073369459_j8ftqxd','Avitha','917034214892','+91',NULL,'Thrissur','[]','import','New Call',9,'New Call',NULL,NULL,1,'	New Lead','2025-12-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Thrissur\", \"Lead_Date\": \"12/4/2025\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Avitha\", \"Primary_Phone\": 7034214892, \"Qualification\": \"B.Ed / M.Sc\"}','2025-12-03 18:30:00'),(510,1,759,'batch_1795073369459_j8ftqxd','Nithul Biju','919947107688','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-12-10 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/10/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Nithul Biju\", \"Primary_Phone\": 9947107688, \"Qualification\": \"BCA\"}','2025-12-09 18:30:00'),(511,1,760,'batch_1795073369459_j8ftqxd','Aldrin Wilson','918590960749','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,1,'	New Lead','2025-12-13 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/13/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Aldrin Wilson\", \"Primary_Phone\": 8590960749}','2025-12-12 18:30:00'),(512,1,761,'batch_1795073369459_j8ftqxd','Jomel P Sasi','919746802512','+91',NULL,NULL,'[]','import','Reference Walkin',10,'Reference Walkin',NULL,NULL,1,'	New Lead','2025-12-17 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/17/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Jomel P Sasi\", \"Primary_Phone\": 9746802512, \"Qualification\": \"B.Sc HM\"}','2025-12-16 18:30:00'),(513,1,762,'batch_1795073369459_j8ftqxd','Midhu','917510720372','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-12-19 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/19/2025\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Midhu\", \"Primary_Phone\": 7510720372}','2025-12-18 18:30:00'),(514,1,763,'batch_1795073369459_j8ftqxd','Bibin Baby','918891301607','+91',NULL,NULL,'[]','import','New Call',9,'New Call',NULL,NULL,1,'	New Lead','2025-12-19 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/19/2025\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Bibin Baby\", \"Primary_Phone\": 8891301607}','2025-12-18 18:30:00'),(515,1,764,'batch_1795073369459_j8ftqxd','Nithin','916235054380','+91',NULL,'Chalakudy','[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,1,'	New Lead','2025-12-29 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Chalakudy\", \"Lead_Date\": \"12/29/2025\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Nithin\", \"Primary_Phone\": 6235054380, \"Qualification\": \"B.Com Finance\"}','2025-12-28 18:30:00'),(516,1,765,'batch_1795073369459_j8ftqxd','Pournamy V S','919947953642','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,4,'Pending Documents','2026-01-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Waiting for documents; still asking for 3rd party arrangement for finance\", \"Lead_Date\": \"1/1/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Pournamy V S\", \"Primary_Phone\": 9947953642, \"Qualification\": \"BBA / National Aerospace\"}','2025-12-31 18:30:00'),(517,1,766,'batch_1795073369459_j8ftqxd','Jithin','917559936024','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,9,'Application Submitted','2026-01-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-19 12:59:29',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Application submitted\", \"Lead_Date\": \"1/2/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"Application Submitted\", \"Student_Name\": \"Jithin\", \"Primary_Phone\": 7559936024, \"Qualification\": \"12th\"}','2026-01-01 18:30:00'),(518,1,767,'batch_1795073369459_j8ftqxd','Alan M V','918714368015','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,2,'In Progress','2026-01-03 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Will come on Monday directly; shared UCOL details, waiting for documents\", \"Lead_Date\": \"1/3/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Alan M V\", \"Primary_Phone\": 8714368015, \"Qualification\": \"12th\"}','2026-01-02 18:30:00'),(519,1,768,'batch_1795073369459_j8ftqxd','Veronica K','917902790819','+91',NULL,NULL,'[]','import','Instagram AD',11,'Instagram AD',NULL,NULL,3,'Lost','2026-01-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-19 12:59:29',502,NULL,70,'[502]','{\"Remarks\": \"Application moved - waiting for offer letter; not interested\", \"Lead_Date\": \"1/4/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Instagram AD\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Veronica K\", \"Primary_Phone\": 7902790819, \"Qualification\": \"M.Sc Supply Chain\"}','2026-01-03 18:30:00'),(520,1,769,'batch_1795073369459_j8ftqxd','Swetha Reji','917356100242','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,5,'No Response','2026-01-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Still no reply from candidate\", \"Lead_Date\": \"1/5/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Swetha Reji\", \"Primary_Phone\": 7356100242, \"Qualification\": \"BBA\"}','2026-01-04 18:30:00'),(521,1,770,'batch_1795073369459_j8ftqxd','Kishore','918281882297','+91',NULL,NULL,'[]','import','Reference Walkin',10,'Reference Walkin',NULL,NULL,9,'Application Submitted','2026-01-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-19 12:59:29',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Submitted application to NZSE Masters in Data\", \"Lead_Date\": \"1/6/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"Application Submitted\", \"Student_Name\": \"Kishore\", \"Primary_Phone\": 8281882297, \"Qualification\": \"B.Tech Engineer\"}','2026-01-05 18:30:00'),(522,1,771,'batch_1795073369459_j8ftqxd','Alen Sabu','917907699924','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,11,'Application Drafted','2026-01-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Application drafted\", \"Lead_Date\": \"1/7/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"Application Drafted\", \"Student_Name\": \"Alen Sabu\", \"Primary_Phone\": 7907699924, \"Qualification\": \"GNM Nurse\"}','2026-01-06 18:30:00'),(523,1,772,'batch_1795073369459_j8ftqxd','Reshmy','919946623909','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,4,'Pending Documents','2026-01-08 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Aswathy handling - waiting to receive documents\", \"Lead_Date\": \"1/8/2026\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Reshmy\", \"Primary_Phone\": 9946623909, \"Qualification\": \"GNM Nurse\", \"Secondary_Phone\": 9539030106}','2026-01-07 18:30:00'),(524,1,773,'batch_1795073369459_j8ftqxd','Simil Benny','918139014854','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,2,'In Progress','2026-01-09 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested in Health Care Certificate Program Level 4\", \"Lead_Date\": \"1/9/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Simil Benny\", \"Primary_Phone\": 8139014854, \"Qualification\": \"12th\"}','2026-01-08 18:30:00'),(525,1,774,'batch_1795073369459_j8ftqxd','Jeswin Shaju','916238139781','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,2,'In Progress','2026-01-10 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested in Health Care Certificate Program Level 5\", \"Lead_Date\": \"1/10/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Jeswin Shaju\", \"Primary_Phone\": 6238139781, \"Qualification\": \"12th\"}','2026-01-09 18:30:00'),(526,1,775,'batch_1795073369459_j8ftqxd','Parvathy Poulouse','919562629824','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,2,'In Progress','2026-01-11 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"1/11/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Parvathy Poulouse\", \"Primary_Phone\": 9562629824, \"Qualification\": \"CAPS\"}','2026-01-10 18:30:00'),(527,1,776,'batch_1795073369459_j8ftqxd','Ann Mariya Devassy','919207393002','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-02-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Given for conditional / declined; now given for diploma\", \"Lead_Date\": \"2/1/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Ann Mariya Devassy\", \"Primary_Phone\": 9207393002}','2026-01-31 18:30:00'),(528,1,777,'batch_1795073369459_j8ftqxd','Mariya','917025652243','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-02-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Details shared MBIL & Masters in Business Intelligence; collected all documents\", \"Lead_Date\": \"2/2/2026\", \"Assigned_To\": \"Sreelakshmi\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mariya\", \"Primary_Phone\": 7025652243, \"Qualification\": \"B.Com\"}','2026-02-01 18:30:00'),(529,1,778,'batch_1795073369459_j8ftqxd','Parvathy','918075421319','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,13,'Lost / Diverted','2026-02-03 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Looking for Germany; not that much interested in NZ\", \"Lead_Date\": \"2/3/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost / Diverted\", \"Student_Name\": \"Parvathy\", \"Primary_Phone\": 8075421319, \"Qualification\": \"GNM Nurse Sanjo\"}','2026-02-02 18:30:00'),(530,1,779,'batch_1795073369459_j8ftqxd','Alex Babu','917306760857','+91',NULL,NULL,'[]','import','Call Walkin',8,'Call Walkin',NULL,NULL,12,'Follow Up','2026-02-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"12th 2021 BioMaths 84%, B.Tech dropped, B.Com 22-25 58%, MBA 2027. NR 21-1 doubts on ITR. Will come on Saturday\", \"Lead_Date\": \"2/4/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"Follow Up\", \"Student_Name\": \"Alex Babu\", \"Primary_Phone\": 7306760857, \"Qualification\": \"MBA Finance\"}','2026-02-03 18:30:00'),(531,1,780,'batch_1795073369459_j8ftqxd','Jisiya','919544075107','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,8,'Decision Pending','2026-02-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Decision pending\", \"Lead_Date\": \"2/5/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Decision Pending\", \"Student_Name\": \"Jisiya\", \"Primary_Phone\": 9544075107, \"Qualification\": \"Optometry\"}','2026-02-04 18:30:00'),(532,1,781,'batch_1795073369459_j8ftqxd','Athul Roy','919745824639','+91',NULL,NULL,'[]','import','Direct Walkin',7,'Direct Walkin',NULL,NULL,5,'No Response','2026-02-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"BA LLB 2023, Safety Officer STED Council, working Doha. NR 16-2, No response 2-6, 24-6 call disconnected\", \"Lead_Date\": \"2/6/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Athul Roy\", \"Primary_Phone\": 9745824639, \"Qualification\": \"BA LLB\"}','2026-02-05 18:30:00'),(533,1,782,'batch_1795073369459_j8ftqxd','Festin Francis','918136847799','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,8,'Decision Pending','2026-02-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Decision pending; fund issue\", \"Lead_Date\": \"2/7/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Decision Pending\", \"Student_Name\": \"Festin Francis\", \"Primary_Phone\": 8136847799, \"Qualification\": \"Diploma\"}','2026-02-06 18:30:00'),(534,1,783,'batch_1795073369459_j8ftqxd','Arjun Saji','917907970712','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-02-08 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Waiting for his update\", \"Lead_Date\": \"2/8/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Arjun Saji\", \"Primary_Phone\": 7907970712, \"Qualification\": \"B.Com\"}','2026-02-07 18:30:00'),(535,1,784,'batch_1795073369459_j8ftqxd','Amal Eldhose','919656917369','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-02-09 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested but needs time to confirm\", \"Lead_Date\": \"2/9/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Amal Eldhose\", \"Primary_Phone\": 9656917369, \"Qualification\": \"12th\"}','2026-02-08 18:30:00'),(536,1,785,'batch_1795073369459_j8ftqxd','Sujay Anil','916238921929','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,7,'Offer Received','2026-02-10 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-19 12:59:29',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Unconditional offer letter received\", \"Lead_Date\": \"2/10/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Sujay Anil\", \"Primary_Phone\": 6238921929, \"Qualification\": \"Nursing\"}','2026-02-09 18:30:00'),(537,1,786,'batch_1795073369459_j8ftqxd','Antonio','919995136859','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,5,'No Response','2026-02-11 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Not responding\", \"Lead_Date\": \"2/11/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Antonio\", \"Primary_Phone\": 9995136859, \"Qualification\": \"B.Tech\"}','2026-02-10 18:30:00'),(538,1,787,'batch_1795073369459_j8ftqxd','Shahin','917293043123','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,4,'Pending Documents','2026-02-12 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Shared documents, waiting for degree certificate\", \"Lead_Date\": \"2/12/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Shahin\", \"Primary_Phone\": 7293043123, \"Qualification\": \"B.Com / MBA Fin\"}','2026-02-11 18:30:00'),(539,1,788,'batch_1795073369459_j8ftqxd','Adarsh','917561806345','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-02-13 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"2/13/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Adarsh\", \"Primary_Phone\": 7561806345, \"Qualification\": \"Commerce\"}','2026-02-12 18:30:00'),(540,1,789,'batch_1795073369459_j8ftqxd','Nash A O','919207053054','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-02-14 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"2/14/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Nash A O\", \"Primary_Phone\": 9207053054, \"Qualification\": \"BCA\"}','2026-02-13 18:30:00'),(541,1,790,'batch_1795073369459_j8ftqxd','Reebish Santhosh','919995259776','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-02-15 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Course details shared\", \"Lead_Date\": \"2/15/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Reebish Santhosh\", \"Primary_Phone\": 9995259776, \"Qualification\": \"Diploma\"}','2026-02-14 18:30:00'),(542,1,791,'batch_1795073369459_j8ftqxd','Aparna Alias','918590470630','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,7,'Offer Received','2026-02-16 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-19 12:59:29',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Received offer from NZSE\", \"Lead_Date\": \"2/16/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Aparna Alias\", \"Primary_Phone\": 8590470630, \"Qualification\": \"Hospital Admin\"}','2026-02-15 18:30:00'),(543,1,792,'batch_1795073369459_j8ftqxd','Nibin John','918089634476','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,7,'Offer Received','2026-03-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-19 12:59:29',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Received offer from SIT; still interested in NZSE Addiction Diploma (2 offers received)\", \"Lead_Date\": \"3/1/2026\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Nibin John\", \"Primary_Phone\": 8089634476}','2026-02-28 18:30:00'),(544,1,793,'batch_1795073369459_j8ftqxd','Nakul Gopinath','918848528025','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-03-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Offer letter waiting\", \"Lead_Date\": \"3/2/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Nakul Gopinath\", \"Primary_Phone\": 8848528025}','2026-03-01 18:30:00'),(545,1,794,'batch_1795073369459_j8ftqxd','Eldho George','919496336332','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,3,'Lost','2026-03-03 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-19 12:59:29',502,NULL,70,'[502]','{\"Remarks\": \"Back out case - age limit\", \"Lead_Date\": \"3/3/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Eldho George\", \"Primary_Phone\": 9496336332}','2026-03-02 18:30:00'),(546,1,795,'batch_1795073369459_j8ftqxd','Josiya','918157085147','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,10,'Visa Stage','2026-03-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Offer letter received; waiting for visa submission\", \"Lead_Date\": \"3/4/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Visa Stage\", \"Student_Name\": \"Josiya\", \"Primary_Phone\": 8157085147}','2026-03-03 18:30:00'),(547,1,796,'batch_1795073369459_j8ftqxd','Neena Mathew','918111938061','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-03-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested in MBIL and NZSE; shared details\", \"Lead_Date\": \"3/5/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Neena Mathew\", \"Primary_Phone\": 8111938061}','2026-03-04 18:30:00'),(548,1,797,'batch_1795073369459_j8ftqxd','Dhiya Rose','917356749374','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-03-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"3/6/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Dhiya Rose\", \"Primary_Phone\": 7356749374}','2026-03-05 18:30:00'),(549,1,798,'batch_1795073369459_j8ftqxd','Sherine Shaju','917736097450','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,3,'Lost','2026-04-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-19 12:59:29',502,NULL,70,'[502]','{\"Remarks\": \"No response 24-6. 12th 2026 78%, going for IELTS; moved UK with other agency\", \"Lead_Date\": \"4/1/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Sherine Shaju\", \"Primary_Phone\": 7736097450, \"Qualification\": \"12th\"}','2026-03-31 18:30:00'),(550,1,799,'batch_1795073369459_j8ftqxd','Renjith T.A','917994242294','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-04-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/2/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Renjith T.A\", \"Primary_Phone\": 7994242294}','2026-04-01 18:30:00'),(551,1,800,'batch_1795073369459_j8ftqxd','Charles George','916235928027','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-04-03 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/3/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Charles George\", \"Primary_Phone\": 6235928027}','2026-04-02 18:30:00'),(552,1,801,'batch_1795073369459_j8ftqxd','John Peter','918921319217','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-04-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/4/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"John Peter\", \"Primary_Phone\": 8921319217}','2026-04-03 18:30:00'),(553,1,802,'batch_1795073369459_j8ftqxd','Akash','918985964850','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-04-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/5/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Akash\", \"Primary_Phone\": 8985964850}','2026-04-04 18:30:00'),(554,1,803,'batch_1795073369459_j8ftqxd','Silpa','918921588848','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-04-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/6/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Silpa\", \"Primary_Phone\": 8921588848}','2026-04-05 18:30:00'),(555,1,804,'batch_1795073369459_j8ftqxd','Maria Rose Joy','916238199308','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,3,'Lost','2026-05-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-19 12:59:29',502,NULL,70,'[502]','{\"Remarks\": \"Moved Australia through other agency\", \"Lead_Date\": \"5/1/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Maria Rose Joy\", \"Primary_Phone\": 6238199308}','2026-04-30 18:30:00'),(556,1,805,'batch_1795073369459_j8ftqxd','Sujil Mathew','919495539298','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,3,'Lost','2026-05-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-19 12:59:29',502,NULL,70,'[502]','{\"Remarks\": \"Course options shared, not interested\", \"Lead_Date\": \"5/2/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Sujil Mathew\", \"Primary_Phone\": 9495539298}','2026-05-01 18:30:00'),(557,1,806,'batch_1795073369459_j8ftqxd','Sanju Sabu','919946613952','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,3,'Lost','2026-05-03 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-19 12:59:29',502,NULL,70,'[502]','{\"Remarks\": \"Not proceeding to abroad education\", \"Lead_Date\": \"5/3/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Sanju Sabu\", \"Primary_Phone\": 9946613952}','2026-05-02 18:30:00'),(558,1,807,'batch_1795073369459_j8ftqxd','Jerin Joy','917306072036','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,5,'No Response','2026-05-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"No response to call\", \"Lead_Date\": \"5/4/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Jerin Joy\", \"Primary_Phone\": 7306072036}','2026-05-03 18:30:00'),(559,1,808,'batch_1795073369459_j8ftqxd','Dini K Davis','919947343239','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,3,'Lost','2026-05-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-19 12:59:29',502,NULL,70,'[502]','{\"Remarks\": \"Not proceeding to abroad education\", \"Lead_Date\": \"5/5/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Dini K Davis\", \"Primary_Phone\": 9947343239}','2026-05-04 18:30:00'),(560,1,809,'batch_1795073369459_j8ftqxd','Emmanuel Xavier','919188105919','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,6,'	Proceeding','2026-05-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/6/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Emmanuel Xavier\", \"Primary_Phone\": 9188105919}','2026-05-05 18:30:00'),(561,1,810,'batch_1795073369459_j8ftqxd','Anette Joy','918848922735','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,6,'	Proceeding','2026-05-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/7/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Anette Joy\", \"Primary_Phone\": 8848922735}','2026-05-06 18:30:00'),(562,1,811,'batch_1795073369459_j8ftqxd','Christal Biju','918606074191','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,6,'	Proceeding','2026-05-08 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/8/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Christal Biju\", \"Primary_Phone\": 8606074191}','2026-05-07 18:30:00'),(563,1,812,'batch_1795073369459_j8ftqxd','Tom Sebastian','917594914948','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,8,'Decision Pending','2026-05-09 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Decision pending\", \"Lead_Date\": \"5/9/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Decision Pending\", \"Student_Name\": \"Tom Sebastian\", \"Primary_Phone\": 7594914948}','2026-05-08 18:30:00'),(564,1,813,'batch_1795073369459_j8ftqxd','Athul Pramond','918089994154','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,6,'	Proceeding','2026-05-10 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/10/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Athul Pramond\", \"Primary_Phone\": 8089994154}','2026-05-09 18:30:00'),(565,1,814,'batch_1795073369459_j8ftqxd','Mohammed Shanif','917561034827','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-05-11 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/11/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mohammed Shanif\", \"Primary_Phone\": 7561034827}','2026-05-10 18:30:00'),(566,1,815,'batch_1795073369459_j8ftqxd','Alen Mathew Paul','918129195563','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-05-12 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/12/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Alen Mathew Paul\", \"Primary_Phone\": 8129195563}','2026-05-11 18:30:00'),(567,1,816,'batch_1795073369459_j8ftqxd','Anjana Suku','919995117694','+91',NULL,'Georgia','[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-05-13 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Country interest: Georgia\", \"Location\": \"Georgia\", \"Lead_Date\": \"5/13/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Anjana Suku\", \"Primary_Phone\": 9995117694}','2026-05-12 18:30:00'),(568,1,817,'batch_1795073369459_j8ftqxd','Devika PV','917736241897','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-05-14 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/14/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Devika PV\", \"Primary_Phone\": 7736241897}','2026-05-13 18:30:00'),(569,1,818,'batch_1795073369459_j8ftqxd','Ananthu MK','918075531696','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-05-15 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/15/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Ananthu MK\", \"Primary_Phone\": 8075531696}','2026-05-14 18:30:00'),(570,1,819,'batch_1795073369459_j8ftqxd','Mebin Benny','917510151304','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-05-16 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/16/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mebin Benny\", \"Primary_Phone\": 7510151304}','2026-05-15 18:30:00'),(571,1,820,'batch_1795073369459_j8ftqxd','Sanjay Krishna','919486711487','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-05-17 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/17/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sanjay Krishna\", \"Primary_Phone\": 9486711487, \"Secondary_Phone\": 9486668807}','2026-05-16 18:30:00'),(572,1,821,'batch_1795073369459_j8ftqxd','Jezebel Merlin','919995366699','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-06-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/1/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Jezebel Merlin\", \"Primary_Phone\": 9995366699}','2026-05-31 18:30:00'),(573,1,822,'batch_1795073369459_j8ftqxd','Grace Helen','916235681421','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-06-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/2/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Grace Helen\", \"Primary_Phone\": 6235681421}','2026-06-01 18:30:00'),(574,1,823,'batch_1795073369459_j8ftqxd','Dinu Denny','916282373018','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-06-03 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/3/2026\", \"Assigned_To\": \"Sreelakshmi\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Dinu Denny\", \"Primary_Phone\": 6282373018}','2026-06-02 18:30:00'),(575,1,824,'batch_1795073369459_j8ftqxd','Mariya Sony','919744467561','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,10,'Visa Stage','2026-06-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Visa proceeding; contacted by Josmi - NZSE\", \"Lead_Date\": \"6/4/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Visa Stage\", \"Student_Name\": \"Mariya Sony\", \"Primary_Phone\": 9744467561}','2026-06-03 18:30:00'),(576,1,825,'batch_1795073369459_j8ftqxd','Aleena Biju','917025486201','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-06-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/5/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Aleena Biju\", \"Primary_Phone\": 7025486201}','2026-06-04 18:30:00'),(577,1,826,'batch_1795073369459_j8ftqxd','Benjammin Benny','917306480425','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-06-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/6/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Benjammin Benny\", \"Primary_Phone\": 7306480425}','2026-06-05 18:30:00'),(578,1,827,'batch_1795073369459_j8ftqxd','Prince Cleetus','916238719423','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-06-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/7/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Prince Cleetus\", \"Primary_Phone\": 6238719423}','2026-06-06 18:30:00'),(579,1,828,'batch_1795073369459_j8ftqxd','Heaven Christo','919567715403','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-06-08 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/8/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Heaven Christo\", \"Primary_Phone\": 9567715403}','2026-06-07 18:30:00'),(580,1,829,'batch_1795073369459_j8ftqxd','Darsana C.S','919562941995','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/1/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Darsana C.S\", \"Primary_Phone\": 9562941995}','2026-06-30 18:30:00'),(581,1,830,'batch_1795073369459_j8ftqxd','Andriya Baby','918848918012','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/2/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Andriya Baby\", \"Primary_Phone\": 8848918012}','2026-07-01 18:30:00'),(582,1,831,'batch_1795073369459_j8ftqxd','Denil K Thoman','919447015393','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/4/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Denil K Thoman\", \"Primary_Phone\": 9447015393}','2026-07-03 18:30:00'),(583,1,832,'batch_1795073369459_j8ftqxd','Ananya Shijo','919142131108','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/5/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Ananya Shijo\", \"Primary_Phone\": 9142131108}','2026-07-04 18:30:00'),(584,1,833,'batch_1795073369459_j8ftqxd','John Saju','918590499317','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/6/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"John Saju\", \"Primary_Phone\": 8590499317}','2026-07-05 18:30:00'),(585,1,834,'batch_1795073369459_j8ftqxd','Gaius Rajan','919447362491','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/7/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Gaius Rajan\", \"Primary_Phone\": 9447362491}','2026-07-06 18:30:00'),(586,1,835,'batch_1795073369459_j8ftqxd','Wilston P Wilson','917736412437','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-08 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/8/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Wilston P Wilson\", \"Primary_Phone\": 7736412437}','2026-07-07 18:30:00'),(587,1,836,'batch_1795073369459_j8ftqxd','Niya Tomy','918547736939','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-09 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/9/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Niya Tomy\", \"Primary_Phone\": 8547736939}','2026-07-08 18:30:00'),(588,1,837,'batch_1795073369459_j8ftqxd','Sial P Raju','919961108841','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-10 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/10/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sial P Raju\", \"Primary_Phone\": 9961108841}','2026-07-09 18:30:00'),(589,1,838,'batch_1795073369459_j8ftqxd','Sanoop Babu','917306028646','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-11 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/11/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sanoop Babu\", \"Primary_Phone\": 7306028646}','2026-07-10 18:30:00'),(590,1,839,'batch_1795073369459_j8ftqxd','Jerin Joy','919633270255','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-07-12 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/12/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Jerin Joy\", \"Primary_Phone\": 9633270255}','2026-07-11 18:30:00'),(591,1,840,'batch_1795073369459_j8ftqxd','Dhanya Louis','919946980757','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,4,'Pending Documents','2026-09-01 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Documents not received\", \"Lead_Date\": \"9/1/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Dhanya Louis\", \"Primary_Phone\": 9946980757}','2026-08-31 18:30:00'),(592,1,841,'batch_1795073369459_j8ftqxd','Aswin Shaji','916282704096','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,7,'Offer Received','2026-09-02 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-19 12:59:29',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Offer received\", \"Lead_Date\": \"9/2/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Aswin Shaji\", \"Primary_Phone\": 6282704096}','2026-09-01 18:30:00'),(593,1,842,'batch_1795073369459_j8ftqxd','Rose Mary Benny','916235768247','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-03 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/3/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Rose Mary Benny\", \"Primary_Phone\": 6235768247}','2026-09-02 18:30:00'),(594,1,843,'batch_1795073369459_j8ftqxd','Sneha Mary Varghese','917028713469','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-04 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/4/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sneha Mary Varghese\", \"Primary_Phone\": 7028713469}','2026-09-03 18:30:00'),(595,1,844,'batch_1795073369459_j8ftqxd','Libin Joseph','918281065205','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-05 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/5/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Libin Joseph\", \"Primary_Phone\": 8281065205}','2026-09-04 18:30:00'),(596,1,845,'batch_1795073369459_j8ftqxd','Abhiesk A','919633785881','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-06 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/6/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Abhiesk A\", \"Primary_Phone\": 9633785881}','2026-09-05 18:30:00'),(597,1,846,'batch_1795073369459_j8ftqxd','Kavya Murali','918590337710','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-07 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/7/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Kavya Murali\", \"Primary_Phone\": 8590337710}','2026-09-06 18:30:00'),(598,1,847,'batch_1795073369459_j8ftqxd','Tinu Yohannan','918606019562','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-08 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/8/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Tinu Yohannan\", \"Primary_Phone\": 8606019562}','2026-09-07 18:30:00'),(599,1,848,'batch_1795073369459_j8ftqxd','Namrutha P','919544758662','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-09 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/9/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Namrutha P\", \"Primary_Phone\": 9544758662}','2026-09-08 18:30:00'),(600,1,849,'batch_1795073369459_j8ftqxd','Mary Anjana Antony','919061660862','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-10 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/10/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mary Anjana Antony\", \"Primary_Phone\": 9061660862}','2026-09-09 18:30:00'),(601,1,850,'batch_1795073369459_j8ftqxd','Akshay Rajendran','919207926995','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-11 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/11/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Akshay Rajendran\", \"Primary_Phone\": 9207926995}','2026-09-10 18:30:00'),(602,1,851,'batch_1795073369459_j8ftqxd','Dibin Biju','919846079560','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-12 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/12/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Dibin Biju\", \"Primary_Phone\": 9846079560}','2026-09-11 18:30:00'),(603,1,852,'batch_1795073369459_j8ftqxd','Denil Joy','918304010349','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-13 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/13/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Denil Joy\", \"Primary_Phone\": 8304010349}','2026-09-12 18:30:00'),(604,1,853,'batch_1795073369459_j8ftqxd','Aparna V','919061433009','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-14 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/14/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Aparna V\", \"Primary_Phone\": 9061433009}','2026-09-13 18:30:00'),(605,1,854,'batch_1795073369459_j8ftqxd','Melissa Jaiby','916363689904','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-15 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/15/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Melissa Jaiby\", \"Primary_Phone\": 6363689904}','2026-09-14 18:30:00'),(606,1,855,'batch_1795073369459_j8ftqxd','Balamuralikrishna','919746380879','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-16 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/16/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Balamuralikrishna\", \"Primary_Phone\": 9746380879}','2026-09-15 18:30:00'),(607,1,856,'batch_1795073369459_j8ftqxd','Nandana Surendran','918086836374','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-17 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/17/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Nandana Surendran\", \"Primary_Phone\": 8086836374}','2026-09-16 18:30:00'),(608,1,857,'batch_1795073369459_j8ftqxd','Albin Reji','919995154072','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-18 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Country interest: Germany\", \"Lead_Date\": \"9/18/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Albin Reji\", \"Primary_Phone\": 9995154072}','2026-09-17 18:30:00'),(609,1,858,'batch_1795073369459_j8ftqxd','Abhijith Siju','918943391979','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-19 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Country interest: Germany\", \"Lead_Date\": \"9/19/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Abhijith Siju\", \"Primary_Phone\": 8943391979}','2026-09-18 18:30:00'),(610,1,859,'batch_1795073369459_j8ftqxd','Anas','918592873809','+91',NULL,NULL,'[]','import','Unknown',12,'Unknown',NULL,NULL,2,'In Progress','2026-09-20 00:00:00','2026-11-19',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/20/2026\", \"Assigned_To\": \"Sandra\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Anas\", \"Primary_Phone\": 8592873809}','2026-09-19 18:30:00'),(611,1,867,'batch_1795757663676_s60vm2l','Rahul Varma','919847100001','+91','rahul.varma@example.com','Kochi, Kerala','[\"UK\", \"Postgraduate\"]','import','Website',13,'Website',NULL,'Study Abroad',9,'Application Submitted','2026-12-05 05:30:00','2026-12-05',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Rahul Varma\", \"Tags\": \"UK, Postgraduate\", \"Email\": \"rahul.varma@example.com\", \"Phone\": \"9847100001\", \"Source\": \"Website\", \"Status\": \"Application Submitted\", \"Address\": \"Kochi, Kerala\", \"Enquiry for\": \"Study Abroad\", \"Follow-up Date\": \"2026-12-05\"}','2026-12-05 00:00:00'),(612,1,868,'batch_1795757663676_s60vm2l','Sneha Nair','919847100002','+91','sneha.nair@example.com','Trivandrum, Kerala','[\"IELTS\", \"Fast Track\"]','import','Instagram',14,'Instagram',NULL,'IELTS Training',9,'Application Submitted','2026-12-06 05:30:00','2026-12-06',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Sneha Nair\", \"Tags\": \"IELTS, Fast Track\", \"Email\": \"sneha.nair@example.com\", \"Phone\": \"9847100002\", \"Source\": \"Instagram\", \"Status\": \"Application Submitted\", \"Address\": \"Trivandrum, Kerala\", \"Enquiry for\": \"IELTS Training\", \"Follow-up Date\": \"2026-12-06\"}','2026-12-06 00:00:00'),(613,1,869,'batch_1795757663676_s60vm2l','Arun Kumar','919847100003','+91','arun.kumar@example.com','Calicut, Kerala','[\"Canada\", \"Work Permit\"]','import','Facebook',15,'Facebook',NULL,'Canada Visa',9,'Application Submitted','2026-12-07 05:30:00','2026-12-07',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Arun Kumar\", \"Tags\": \"Canada, Work Permit\", \"Email\": \"arun.kumar@example.com\", \"Phone\": \"9847100003\", \"Source\": \"Facebook\", \"Status\": \"Application Submitted\", \"Address\": \"Calicut, Kerala\", \"Enquiry for\": \"Canada Visa\", \"Follow-up Date\": \"2026-12-07\"}','2026-12-07 00:00:00'),(614,1,870,'batch_1795757663676_s60vm2l','Anjali Menon','919847100004','+91','anjali.menon@example.com','Thrissur, Kerala','[\"Australia\", \"Nursing\"]','import','WhatsApp',16,'WhatsApp',NULL,'Study Abroad',9,'Application Submitted','2026-12-08 05:30:00','2026-12-08',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Anjali Menon\", \"Tags\": \"Australia, Nursing\", \"Email\": \"anjali.menon@example.com\", \"Phone\": \"9847100004\", \"Source\": \"WhatsApp\", \"Status\": \"Application Submitted\", \"Address\": \"Thrissur, Kerala\", \"Enquiry for\": \"Study Abroad\", \"Follow-up Date\": \"2026-12-08\"}','2026-12-08 00:00:00'),(615,1,871,'batch_1795757663676_s60vm2l','Faisal Mohammed','919847100005','+91','faisal.m@example.com','Malappuram, Kerala','[\"Germany\", \"Masters\"]','import','Referral',17,'Referral',NULL,'Germany Visa',9,'Application Submitted','2026-12-09 05:30:00','2026-12-09',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Faisal Mohammed\", \"Tags\": \"Germany, Masters\", \"Email\": \"faisal.m@example.com\", \"Phone\": \"9847100005\", \"Source\": \"Referral\", \"Status\": \"Application Submitted\", \"Address\": \"Malappuram, Kerala\", \"Enquiry for\": \"Germany Visa\", \"Follow-up Date\": \"2026-12-09\"}','2026-12-09 00:00:00'),(616,1,872,'batch_1795757663676_s60vm2l','Divya Pillai','919847100006','+91','divya.pillai@example.com','Kottayam, Kerala','[\"PTE\", \"Academic\"]','import','Walk-in',18,'Walk-in',NULL,'PTE Training',9,'Application Submitted','2026-12-10 05:30:00','2026-12-10',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Divya Pillai\", \"Tags\": \"PTE, Academic\", \"Email\": \"divya.pillai@example.com\", \"Phone\": \"9847100006\", \"Source\": \"Walk-in\", \"Status\": \"Application Submitted\", \"Address\": \"Kottayam, Kerala\", \"Enquiry for\": \"PTE Training\", \"Follow-up Date\": \"2026-12-10\"}','2026-12-10 00:00:00'),(617,1,873,'batch_1795757663676_s60vm2l','George Thomas','919847100007','+91','george.t@example.com','Kollam, Kerala','[\"Ireland\", \"IT\"]','import','Google Ads',19,'Google Ads',NULL,'Study Abroad',9,'Application Submitted','2026-12-11 05:30:00','2026-12-11',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"George Thomas\", \"Tags\": \"Ireland, IT\", \"Email\": \"george.t@example.com\", \"Phone\": \"9847100007\", \"Source\": \"Google Ads\", \"Status\": \"Application Submitted\", \"Address\": \"Kollam, Kerala\", \"Enquiry for\": \"Study Abroad\", \"Follow-up Date\": \"2026-12-11\"}','2026-12-11 00:00:00'),(618,1,874,'batch_1795757663676_s60vm2l','Meera Krishnan','919847100008','+91','meera.k@example.com','Palakkad, Kerala','[\"UK\", \"Healthcare\"]','import','LinkedIn',20,'LinkedIn',NULL,'UK Visa',9,'Application Submitted','2026-12-12 05:30:00','2026-12-12',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Meera Krishnan\", \"Tags\": \"UK, Healthcare\", \"Email\": \"meera.k@example.com\", \"Phone\": \"9847100008\", \"Source\": \"LinkedIn\", \"Status\": \"Application Submitted\", \"Address\": \"Palakkad, Kerala\", \"Enquiry for\": \"UK Visa\", \"Follow-up Date\": \"2026-12-12\"}','2026-12-12 00:00:00'),(619,1,875,'batch_1795757663676_s60vm2l','Sanjay Das','919847100009','+91','sanjay.das@example.com','Kannur, Kerala','[\"USA\", \"Engineering\"]','import','Education Fair',21,'Education Fair',NULL,'Study Abroad',9,'Application Submitted','2026-12-13 05:30:00','2026-12-13',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Sanjay Das\", \"Tags\": \"USA, Engineering\", \"Email\": \"sanjay.das@example.com\", \"Phone\": \"9847100009\", \"Source\": \"Education Fair\", \"Status\": \"Application Submitted\", \"Address\": \"Kannur, Kerala\", \"Enquiry for\": \"Study Abroad\", \"Follow-up Date\": \"2026-12-13\"}','2026-12-13 00:00:00'),(620,1,876,'batch_1795757663676_s60vm2l','Ritu Sharma','919847100010','+91','ritu.sharma@example.com','Alappuzha, Kerala','[\"Schengen\", \"Visit\"]','import','Direct Call',22,'Direct Call',NULL,'Tourist Visa',9,'Application Submitted','2026-12-14 05:30:00','2026-12-14',1,2,'test',2,'rw',507,'reas',1,1,'2026-11-27 11:04:24',507,0,NULL,NULL,NULL,131,'[131, 507]','{\"Name\": \"Ritu Sharma\", \"Tags\": \"Schengen, Visit\", \"Email\": \"ritu.sharma@example.com\", \"Phone\": \"9847100010\", \"Source\": \"Direct Call\", \"Status\": \"Application Submitted\", \"Address\": \"Alappuzha, Kerala\", \"Enquiry for\": \"Tourist Visa\", \"Follow-up Date\": \"2026-12-14\"}','2026-12-14 00:00:00');
/*!40000 ALTER TABLE `imported_leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intakes`
--

DROP TABLE IF EXISTS `intakes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intakes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `intakes_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intakes`
--

LOCK TABLES `intakes` WRITE;
/*!40000 ALTER TABLE `intakes` DISABLE KEYS */;
/*!40000 ALTER TABLE `intakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integrations`
--

DROP TABLE IF EXISTS `integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `type` enum('zoho','hubspot','woocommerce','shopify','zapier','pabbly','google_sheets','google_calendar','openai','razorpay','stripe','payu') DEFAULT NULL,
  `config` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `connected_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `integrations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integrations`
--

LOCK TABLES `integrations` WRITE;
/*!40000 ALTER TABLE `integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_call_logs`
--

DROP TABLE IF EXISTS `ivr_call_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_call_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `flow_id` int DEFAULT NULL,
  `caller_number` varchar(20) DEFAULT NULL,
  `key_pressed` varchar(5) DEFAULT NULL,
  `call_duration` int DEFAULT NULL,
  `status` enum('answered','missed','forwarded') DEFAULT NULL,
  `called_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `flow_id` (`flow_id`),
  CONSTRAINT `ivr_call_logs_ibfk_1` FOREIGN KEY (`flow_id`) REFERENCES `ivr_flows` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_call_logs`
--

LOCK TABLES `ivr_call_logs` WRITE;
/*!40000 ALTER TABLE `ivr_call_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ivr_call_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_flows`
--

DROP TABLE IF EXISTS `ivr_flows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_flows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `did_number` varchar(20) DEFAULT NULL,
  `welcome_audio_url` varchar(500) DEFAULT NULL,
  `menu` json DEFAULT NULL,
  `fallback_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `ivr_flows_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_flows`
--

LOCK TABLES `ivr_flows` WRITE;
/*!40000 ALTER TABLE `ivr_flows` DISABLE KEYS */;
/*!40000 ALTER TABLE `ivr_flows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_emails`
--

DROP TABLE IF EXISTS `lead_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_emails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `contact_id` int DEFAULT NULL,
  `campaign_id` varchar(50) DEFAULT NULL,
  `brevo_message_id` varchar(255) DEFAULT NULL,
  `sender_email` varchar(255) DEFAULT NULL,
  `to_email` varchar(255) NOT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `content` longtext,
  `status` varchar(30) NOT NULL DEFAULT 'sent',
  `bounce_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT NULL,
  `last_event` varchar(50) DEFAULT NULL,
  `last_event_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_contact` (`contact_id`),
  KEY `idx_msg` (`brevo_message_id`),
  KEY `idx_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_emails`
--

LOCK TABLES `lead_emails` WRITE;
/*!40000 ALTER TABLE `lead_emails` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_emails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_fields`
--

DROP TABLE IF EXISTS `lead_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_fields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `label` varchar(120) NOT NULL,
  `field_key` varchar(80) NOT NULL,
  `field_type` enum('text','number','dropdown','date','dob','email','phone','textarea') NOT NULL DEFAULT 'text',
  `options` json DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_biz_key` (`business_id`,`field_key`),
  KEY `fk_lf_field_category` (`category_id`),
  CONSTRAINT `fk_lf_field_category` FOREIGN KEY (`category_id`) REFERENCES `field_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lead_fields_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_fields`
--

LOCK TABLES `lead_fields` WRITE;
/*!40000 ALTER TABLE `lead_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_statuses`
--

DROP TABLE IF EXISTS `lead_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `is_followup` tinyint(1) DEFAULT '0',
  `is_transfer` tinyint(1) DEFAULT '0',
  `transfer_department_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `transfer_department_id` (`transfer_department_id`),
  CONSTRAINT `lead_statuses_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `lead_statuses_ibfk_2` FOREIGN KEY (`transfer_department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_statuses`
--

LOCK TABLES `lead_statuses` WRITE;
/*!40000 ALTER TABLE `lead_statuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `enquiry_for_id` int DEFAULT NULL,
  `status` varchar(100) DEFAULT 'New',
  `loss_reason` varchar(255) DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  KEY `enquiry_for_id` (`enquiry_for_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leads_ibfk_3` FOREIGN KEY (`enquiry_for_id`) REFERENCES `enquiry_fors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `leads_ibfk_4` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int DEFAULT NULL,
  `direction` enum('inbound','outbound') DEFAULT NULL,
  `content` text,
  `media_url` varchar(500) DEFAULT NULL,
  `message_type` enum('text','image','video','document','template','interactive','location','audio','voice','sticker') DEFAULT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'sent',
  `wa_message_id` varchar(100) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reference_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_business_id` (`business_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (16,1,132,'assignment','Bulk Leads Transferred','50 lead(s) have been transferred to you by Administrator.',738,0,'2026-11-24 11:04:13'),(17,1,132,'assignment','Contact Reassigned','A contact has been assigned to you: testing1',861,0,'2026-11-24 11:08:08'),(19,1,132,'assignment','Contact Reassigned','A contact has been assigned to you: Christy Thomas',739,0,'2026-11-26 07:29:16'),(23,1,132,'assignment','Contact Reassigned','A contact has been assigned to you: Alisha Jose',746,0,'2026-11-26 07:35:43'),(26,1,502,'assignment','Contact Reassigned','A contact has been assigned to you: Christy Thomas',739,0,'2026-11-26 11:20:09'),(27,1,502,'assignment','Contact Reassigned','A contact has been assigned to you: Jeswin Shaju',774,0,'2026-11-26 11:46:30'),(28,1,507,'assignment','Contact Reassigned','A contact has been assigned to you: Parvathy',778,0,'2026-11-26 11:58:47'),(29,1,507,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',866,0,'2026-11-27 05:00:37'),(30,1,502,'assignment','Contact Reassigned','A contact has been assigned to you: Christy Thomas',739,0,'2026-11-27 07:07:49'),(31,1,502,'assignment','Contact Reassigned','A contact has been assigned to you: Christy Thomas',739,0,'2026-11-27 07:08:11'),(32,1,502,'assignment','Contact Reassigned','A contact has been assigned to you: Arya Unni',741,0,'2026-11-27 07:08:39'),(33,1,502,'assignment','Contact Reassigned','A contact has been assigned to you: Mereena Sebastian',740,0,'2026-11-27 07:09:37'),(34,1,132,'assignment','Contact Reassigned','A contact has been assigned to you: Riju Sabu',864,0,'2026-11-27 07:48:09');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opt_in_links`
--

DROP TABLE IF EXISTS `opt_in_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opt_in_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `token` varchar(100) DEFAULT NULL,
  `redirect_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `opt_in_links_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opt_in_links`
--

LOCK TABLES `opt_in_links` WRITE;
/*!40000 ALTER TABLE `opt_in_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `opt_in_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `conversation_id` int DEFAULT NULL,
  `items` json DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `tax` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_gateway` enum('razorpay','stripe','payu') DEFAULT NULL,
  `payment_id` varchar(200) DEFAULT NULL,
  `shipping_address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `probabilities`
--

DROP TABLE IF EXISTS `probabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `probabilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT '#64748b',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `probabilities_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `probabilities`
--

LOCK TABLES `probabilities` WRITE;
/*!40000 ALTER TABLE `probabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `probabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_attendance`
--

DROP TABLE IF EXISTS `pte_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pte_student_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `session_date` date NOT NULL,
  `session_title` varchar(255) DEFAULT NULL,
  `status` enum('Present','Absent','Late','Excused') DEFAULT 'Present',
  `remarks` text,
  `marked_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pa_student` (`pte_student_id`),
  KEY `idx_pa_contact` (`contact_id`),
  CONSTRAINT `pte_attendance_ibfk_1` FOREIGN KEY (`pte_student_id`) REFERENCES `pte_students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pte_attendance_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_attendance`
--

LOCK TABLES `pte_attendance` WRITE;
/*!40000 ALTER TABLE `pte_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `pte_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_batches`
--

DROP TABLE IF EXISTS `pte_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `batch_name` varchar(150) NOT NULL,
  `trainer_id` int DEFAULT NULL,
  `trainer_name` varchar(255) DEFAULT NULL,
  `schedule` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `capacity` int NOT NULL DEFAULT '20',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pb_biz` (`business_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_batches`
--

LOCK TABLES `pte_batches` WRITE;
/*!40000 ALTER TABLE `pte_batches` DISABLE KEYS */;
INSERT INTO `pte_batches` VALUES (1,1,'PTE Morning Foundation',NULL,NULL,'Mon-Fri 08:30 AM - 10:30 AM',NULL,NULL,20,1,'2026-11-19 09:56:15','2026-11-19 09:56:15'),(2,1,'PTE Fast-Track Intensive',NULL,NULL,'Mon-Fri 02:00 PM - 04:30 PM',NULL,NULL,15,1,'2026-11-19 09:56:15','2026-11-19 09:56:15'),(3,1,'PTE Weekend Masterclass',NULL,NULL,'Sat-Sun 10:00 AM - 02:00 PM',NULL,NULL,25,1,'2026-11-19 09:56:15','2026-11-19 09:56:15'),(7,6,'PTE Morning Foundation',NULL,NULL,'Mon-Fri 08:30 AM - 10:30 AM',NULL,NULL,20,1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(8,6,'PTE Fast-Track Intensive',NULL,NULL,'Mon-Fri 02:00 PM - 04:30 PM',NULL,NULL,15,1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(9,6,'PTE Weekend Masterclass',NULL,NULL,'Sat-Sun 10:00 AM - 02:00 PM',NULL,NULL,25,1,'2026-11-19 12:32:23','2026-11-19 12:32:23');
/*!40000 ALTER TABLE `pte_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_exams`
--

DROP TABLE IF EXISTS `pte_exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pte_student_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `booking_date` date DEFAULT NULL,
  `exam_date` date NOT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `mode` enum('Offline Center','Online / Home') DEFAULT 'Offline Center',
  `notes` text,
  `result_status` enum('Result Pending','Result Received') DEFAULT 'Result Pending',
  `result_received_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pe_student` (`pte_student_id`),
  KEY `idx_pe_contact` (`contact_id`),
  CONSTRAINT `pte_exams_ibfk_1` FOREIGN KEY (`pte_student_id`) REFERENCES `pte_students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pte_exams_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_exams`
--

LOCK TABLES `pte_exams` WRITE;
/*!40000 ALTER TABLE `pte_exams` DISABLE KEYS */;
/*!40000 ALTER TABLE `pte_exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_mock_tests`
--

DROP TABLE IF EXISTS `pte_mock_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_mock_tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pte_student_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `test_date` date NOT NULL,
  `test_title` varchar(150) DEFAULT 'Mock Test',
  `overall_score` decimal(4,1) NOT NULL,
  `listening` decimal(4,1) DEFAULT NULL,
  `reading` decimal(4,1) DEFAULT NULL,
  `speaking` decimal(4,1) DEFAULT NULL,
  `writing` decimal(4,1) DEFAULT NULL,
  `comments` text,
  `evaluated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pm_student` (`pte_student_id`),
  KEY `idx_pm_contact` (`contact_id`),
  CONSTRAINT `pte_mock_tests_ibfk_1` FOREIGN KEY (`pte_student_id`) REFERENCES `pte_students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pte_mock_tests_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_mock_tests`
--

LOCK TABLES `pte_mock_tests` WRITE;
/*!40000 ALTER TABLE `pte_mock_tests` DISABLE KEYS */;
/*!40000 ALTER TABLE `pte_mock_tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_packages`
--

DROP TABLE IF EXISTS `pte_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `total_sessions` int DEFAULT '20',
  `mock_tests_count` int DEFAULT '5',
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ppkg_biz` (`business_id`),
  CONSTRAINT `pte_packages_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_packages`
--

LOCK TABLES `pte_packages` WRITE;
/*!40000 ALTER TABLE `pte_packages` DISABLE KEYS */;
INSERT INTO `pte_packages` VALUES (1,1,'Standard Coaching (30 Days)','30 Days',12000.00,30,5,'Comprehensive 4-week preparation covering all four communicative skills.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(2,1,'Comprehensive Mastery (60 Days)','60 Days',20000.00,60,10,'In-depth foundation and masterclass with unlimited practice portal access.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(3,1,'Crash Course (15 Days)','15 Days',8000.00,15,3,'Intensive high-yield test strategies and rapid mock assessment for repeat test-takers.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(4,1,'Weekend Fast-Track','4 Weekends',10000.00,8,4,'Weekend-only batch tailored for working professionals and university students.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(5,1,'One-on-One Mentorship','Flexible',25000.00,20,8,'Dedicated personal trainer with individualized speech analysis and essay reviews.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(6,6,'Standard Coaching (30 Days)','30 Days',12000.00,30,5,'Comprehensive 4-week preparation covering all four communicative skills.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(7,6,'Comprehensive Mastery (60 Days)','60 Days',20000.00,60,10,'In-depth foundation and masterclass with unlimited practice portal access.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(8,6,'Crash Course (15 Days)','15 Days',8000.00,15,3,'Intensive high-yield test strategies and rapid mock assessment for repeat test-takers.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(9,6,'Weekend Fast-Track','4 Weekends',10000.00,8,4,'Weekend-only batch tailored for working professionals and university students.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(10,6,'One-on-One Mentorship','Flexible',25000.00,20,8,'Dedicated personal trainer with individualized speech analysis and essay reviews.',1,'2026-11-19 11:39:46','2026-11-19 11:39:46');
/*!40000 ALTER TABLE `pte_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_results`
--

DROP TABLE IF EXISTS `pte_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pte_student_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `exam_id` int DEFAULT NULL,
  `exam_date` date NOT NULL,
  `overall_score` decimal(4,1) NOT NULL,
  `listening` decimal(4,1) DEFAULT NULL,
  `reading` decimal(4,1) DEFAULT NULL,
  `speaking` decimal(4,1) DEFAULT NULL,
  `writing` decimal(4,1) DEFAULT NULL,
  `target_score` decimal(4,1) DEFAULT NULL,
  `target_achieved` tinyint(1) DEFAULT '0',
  `achievement_date` date DEFAULT NULL,
  `next_action` varchar(255) DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pr_student` (`pte_student_id`),
  KEY `idx_pr_contact` (`contact_id`),
  CONSTRAINT `pte_results_ibfk_1` FOREIGN KEY (`pte_student_id`) REFERENCES `pte_students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pte_results_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_results`
--

LOCK TABLES `pte_results` WRITE;
/*!40000 ALTER TABLE `pte_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `pte_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_statuses`
--

DROP TABLE IF EXISTS `pte_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `stage_order` int DEFAULT '1',
  `color` varchar(50) DEFAULT '#3b82f6',
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pstat_biz` (`business_id`),
  CONSTRAINT `pte_statuses_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_statuses`
--

LOCK TABLES `pte_statuses` WRITE;
/*!40000 ALTER TABLE `pte_statuses` DISABLE KEYS */;
INSERT INTO `pte_statuses` VALUES (1,1,'Recommended',1,'#6366f1','Initial PTE coaching recommendation',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(2,1,'Referred',2,'#8b5cf6','Student referred to PTE branch/faculty',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(3,1,'Joined',3,'#3b82f6','Enrolled and joined regular classes',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(4,1,'Training',4,'#06b6d4','Active coaching and daily practice',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(5,1,'Mock Test',5,'#eab308','Engaged in mock tests & evaluations',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(6,1,'Exam Booked',6,'#f97316','Official Pearson PTE exam date booked',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(7,1,'Result Pending',7,'#a855f7','Exam completed, awaiting official score report',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(8,1,'Target Achieved',8,'#10b981','Target score achieved - eligible for university application',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(9,1,'Target Not Achieved',9,'#ef4444','Target score not achieved - revision needed',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(10,1,'Application Created',10,'#059669','Handed over for university admission application',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(11,1,'Dropped',11,'#64748b','Discontinued / dropped out',1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(23,6,'Recommended',1,'#6366f1','Initial PTE coaching recommendation',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(24,6,'Referred',2,'#8b5cf6','Student referred to PTE branch/faculty',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(25,6,'Joined',3,'#3b82f6','Enrolled and joined regular classes',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(26,6,'Training',4,'#06b6d4','Active coaching and daily practice',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(27,6,'Mock Test',5,'#eab308','Engaged in mock tests & evaluations',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(28,6,'Exam Booked',6,'#f97316','Official Pearson PTE exam date booked',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(29,6,'Result Pending',7,'#a855f7','Exam completed, awaiting official score report',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(30,6,'Target Achieved',8,'#10b981','Target score achieved - eligible for university application',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(31,6,'Target Not Achieved',9,'#ef4444','Target score not achieved - revision needed',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(32,6,'Application Created',10,'#059669','Handed over for university admission application',1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(33,6,'Dropped',11,'#64748b','Discontinued / dropped out',1,'2026-11-19 12:32:23','2026-11-19 12:32:23');
/*!40000 ALTER TABLE `pte_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_students`
--

DROP TABLE IF EXISTS `pte_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `original_counsellor_id` int DEFAULT NULL,
  `original_counsellor_name` varchar(255) DEFAULT NULL,
  `referring_counsellor_id` int DEFAULT NULL,
  `referring_counsellor_name` varchar(255) DEFAULT NULL,
  `recommendation_date` date DEFAULT NULL,
  `referral_date` date DEFAULT NULL,
  `join_date` date DEFAULT NULL,
  `target_achievement_date` date DEFAULT NULL,
  `application_date` date DEFAULT NULL,
  `package_name` varchar(150) DEFAULT NULL,
  `target_score` decimal(4,1) DEFAULT NULL,
  `current_score` decimal(4,1) DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  `batch_name` varchar(150) DEFAULT NULL,
  `trainer_id` int DEFAULT NULL,
  `trainer_name` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Recommended',
  `target_achieved` tinyint(1) DEFAULT '0',
  `application_id` int DEFAULT NULL,
  `followup_date` date DEFAULT NULL,
  `followup_remarks` text,
  `remarks` text,
  `created_by` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ps_contact` (`contact_id`),
  KEY `idx_ps_biz` (`business_id`),
  KEY `idx_ps_batch` (`batch_id`),
  CONSTRAINT `pte_students_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pte_students_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pte_students_ibfk_3` FOREIGN KEY (`batch_id`) REFERENCES `pte_batches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_students`
--

LOCK TABLES `pte_students` WRITE;
/*!40000 ALTER TABLE `pte_students` DISABLE KEYS */;
/*!40000 ALTER TABLE `pte_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pte_trainers`
--

DROP TABLE IF EXISTS `pte_trainers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pte_trainers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `specialization` varchar(150) DEFAULT 'PTE Academic',
  `user_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ptrain_biz` (`business_id`),
  CONSTRAINT `pte_trainers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pte_trainers`
--

LOCK TABLES `pte_trainers` WRITE;
/*!40000 ALTER TABLE `pte_trainers` DISABLE KEYS */;
INSERT INTO `pte_trainers` VALUES (1,1,'Dr. Sarah Jenkins','sarah.pte@trackbox.com','+1-555-0192','PTE Speaking & Pronunciation',NULL,1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(2,1,'David Wilson','david.wilson@trackbox.com','+1-555-0144','PTE Academic Master Trainer',NULL,1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(3,1,'Ananya Patel','ananya.p@trackbox.com','+1-555-0178','PTE Writing & Grammar Analysis',NULL,1,'2026-11-19 11:39:46','2026-11-19 11:39:46'),(7,6,'Dr. Sarah Jenkins','sarah.pte@trackbox.com','+1-555-0192','PTE Speaking & Pronunciation',NULL,1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(8,6,'David Wilson','david.wilson@trackbox.com','+1-555-0144','PTE Academic Master Trainer',NULL,1,'2026-11-19 12:32:23','2026-11-19 12:32:23'),(9,6,'Ananya Patel','ananya.p@trackbox.com','+1-555-0178','PTE Writing & Grammar Analysis',NULL,1,'2026-11-19 12:32:23','2026-11-19 12:32:23');
/*!40000 ALTER TABLE `pte_trainers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rcs_campaigns`
--

DROP TABLE IF EXISTS `rcs_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rcs_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `sender_id` varchar(100) DEFAULT NULL,
  `content` json DEFAULT NULL,
  `target_tags` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_read` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `rcs_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcs_campaigns`
--

LOCK TABLES `rcs_campaigns` WRITE;
/*!40000 ALTER TABLE `rcs_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `rcs_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rcs_templates`
--

DROP TABLE IF EXISTS `rcs_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rcs_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `card_type` enum('text','rich_card','carousel','quick_reply') DEFAULT NULL,
  `content` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `rcs_templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcs_templates`
--

LOCK TABLES `rcs_templates` WRITE;
/*!40000 ALTER TABLE `rcs_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `rcs_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt_types`
--

DROP TABLE IF EXISTS `receipt_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `receipt_types_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_types`
--

LOCK TABLES `receipt_types` WRITE;
/*!40000 ALTER TABLE `receipt_types` DISABLE KEYS */;
INSERT INTO `receipt_types` VALUES (1,1,'res','2026-11-23 07:36:11');
/*!40000 ALTER TABLE `receipt_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `receipt_type_id` int DEFAULT NULL,
  `receipt_type_name` varchar(255) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `receipt_date` date NOT NULL,
  `description` text,
  `created_by` int DEFAULT NULL,
  `created_by_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `receipt_type_id` (`receipt_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `receipts_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `receipts_ibfk_3` FOREIGN KEY (`receipt_type_id`) REFERENCES `receipt_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `receipts_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shared_media_library`
--

DROP TABLE IF EXISTS `shared_media_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shared_media_library` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_type` enum('image','video','document','audio') DEFAULT 'document',
  `file_size` int DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `shared_media_library_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shared_media_library_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shared_media_library`
--

LOCK TABLES `shared_media_library` WRITE;
/*!40000 ALTER TABLE `shared_media_library` DISABLE KEYS */;
/*!40000 ALTER TABLE `shared_media_library` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_campaigns`
--

DROP TABLE IF EXISTS `sms_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `message` text,
  `target_tags` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_failed` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `sms_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_campaigns`
--

LOCK TABLES `sms_campaigns` WRITE;
/*!40000 ALTER TABLE `sms_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_dlt_templates`
--

DROP TABLE IF EXISTS `sms_dlt_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_dlt_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `message` text,
  `type` enum('transactional','promotional','otp') DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `sms_dlt_templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_dlt_templates`
--

LOCK TABLES `sms_dlt_templates` WRITE;
/*!40000 ALTER TABLE `sms_dlt_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_dlt_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_accounts`
--

DROP TABLE IF EXISTS `social_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `platform` enum('whatsapp','facebook','instagram') NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `phone_id` varchar(100) DEFAULT NULL,
  `account_id` varchar(100) DEFAULT NULL,
  `token` text NOT NULL,
  `verify_token` varchar(100) DEFAULT NULL,
  `waba_id` varchar(100) DEFAULT NULL,
  `app_id` varchar(100) DEFAULT NULL,
  `app_secret` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `source_category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `fk_sa_source_category` (`source_category_id`),
  CONSTRAINT `fk_sa_source_category` FOREIGN KEY (`source_category_id`) REFERENCES `source_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `social_accounts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_accounts`
--

LOCK TABLES `social_accounts` WRITE;
/*!40000 ALTER TABLE `social_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `source_categories`
--

DROP TABLE IF EXISTS `source_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `source_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `source_categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `source_categories`
--

LOCK TABLES `source_categories` WRITE;
/*!40000 ALTER TABLE `source_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `source_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statuses`
--

DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `follow_needed` enum('Yes','No','Won','Loss') DEFAULT 'Yes',
  `color` varchar(20) DEFAULT '#000000',
  `sequence` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `transfer` tinyint(1) DEFAULT '0',
  `department_id` int DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (1,'	New Lead','Yes','#4F46E5',0,'2026-11-17 07:16:01','2026-11-17 07:16:01',0,NULL,NULL),(2,'In Progress','Yes','#4F46E5',0,'2026-11-17 07:16:09','2026-11-17 07:16:09',0,NULL,NULL),(3,'Lost','Yes','#4F46E5',0,'2026-11-17 07:16:18','2026-11-17 07:16:22',1,NULL,'sale_lost'),(4,'Pending Documents','Yes','#4F46E5',0,'2026-11-17 07:16:30','2026-11-17 07:16:30',1,NULL,NULL),(5,'No Response','Yes','#4F46E5',0,'2026-11-17 07:16:36','2026-11-17 07:16:36',0,NULL,NULL),(6,'	Proceeding','Yes','#4F46E5',0,'2026-11-17 07:16:43','2026-11-17 07:16:43',0,NULL,NULL),(7,'Offer Received','Yes','#4F46E5',0,'2026-11-17 07:16:52','2026-11-17 07:16:52',1,NULL,'sale'),(8,'Decision Pending','Yes','#4F46E5',0,'2026-11-17 07:16:59','2026-11-17 07:16:59',1,NULL,NULL),(9,'Application Submitted','Yes','#4F46E5',0,'2026-11-17 07:17:24','2026-11-17 07:17:24',1,NULL,'sale'),(10,'Visa Stage','Yes','#4F46E5',0,'2026-11-17 07:17:33','2026-11-17 07:17:33',1,NULL,NULL),(11,'Application Drafted','Yes','#4F46E5',0,'2026-11-17 07:17:42','2026-11-17 07:17:42',0,NULL,NULL),(12,'Follow Up','Yes','#4F46E5',0,'2026-11-17 07:17:50','2026-11-17 07:17:50',1,NULL,NULL),(13,'Lost / Diverted','Yes','#4F46E5',0,'2026-11-17 07:17:58','2026-11-17 07:17:58',1,NULL,NULL),(14,'Coaching','Yes','#4F46E5',0,'2026-11-17 07:18:05','2026-11-17 07:18:05',0,NULL,NULL);
/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `team_id` int NOT NULL,
  `user_id` int NOT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_user` (`team_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
INSERT INTO `team_members` VALUES (62,25,70,'2026-11-25 06:00:36'),(63,25,132,'2026-11-25 06:00:36'),(64,25,131,'2026-11-25 06:00:36'),(65,25,502,'2026-11-25 06:00:36');
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `user_id` int NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `fk_teams_user_id` (`user_id`),
  CONSTRAINT `fk_teams_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (25,1,70,NULL,'2026-11-25 06:00:36');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `category` enum('MARKETING','UTILITY','AUTHENTICATION') DEFAULT NULL,
  `language` varchar(10) DEFAULT 'en',
  `header_type` enum('none','text','image','video','document') DEFAULT 'none',
  `header_content` text,
  `body` text,
  `footer` text,
  `buttons` json DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `wa_template_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `universities`
--

DROP TABLE IF EXISTS `universities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `universities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'New Zealand',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `universities`
--

LOCK TABLES `universities` WRITE;
/*!40000 ALTER TABLE `universities` DISABLE KEYS */;
INSERT INTO `universities` VALUES (1,'dvd','New Zealand','v',NULL,NULL,'2026-11-18 08:24:46','2026-11-18 08:24:46');
/*!40000 ALTER TABLE `universities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_document_upload`
--

DROP TABLE IF EXISTS `user_document_upload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_document_upload` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `notes` text,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `user_document_upload_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_document_upload_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_document_upload_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_document_upload`
--

LOCK TABLES `user_document_upload` WRITE;
/*!40000 ALTER TABLE `user_document_upload` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_document_upload` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('superadmin','admin','manager','agent') DEFAULT 'agent',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(255) DEFAULT NULL,
  `agent_status` enum('active','inactive') DEFAULT 'active',
  `designation_id` int DEFAULT NULL,
  `employee_code` varchar(100) DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `permissions` text,
  `allowed_custom_field_categories` json DEFAULT NULL,
  `is_dev` tinyint(1) NOT NULL DEFAULT '0',
  `company_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `unique_user_phone` (`phone`),
  KEY `business_id` (`business_id`),
  KEY `fk_users_branch` (`branch_id`),
  KEY `fk_users_department` (`department_id`),
  KEY `idx_users_email` (`email`),
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=508 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (70,1,NULL,NULL,'Administrator','admin@trackbox.com','8086086817','$2b$10$YLMl/gnBCALernNeRSly0OVKF3moUzJIz0xG9K0Q.mMfPLzK1t1pm','admin',1,'2026-11-11 07:08:03','admin','active',NULL,NULL,NULL,NULL,'[]',0,NULL),(71,1,NULL,NULL,'UFS Developer','ufs@trackbox.com',NULL,'$2b$10$YLMl/gnBCALernNeRSly0OVKF3moUzJIz0xG9K0Q.mMfPLzK1t1pm','superadmin',1,'2026-11-11 07:08:03','ufs','active',NULL,NULL,NULL,NULL,NULL,1,NULL),(131,1,1,1,'Rahul Menon','rahul.menon@trackboxcrm.com','8129025108','$2b$10$TPYvhCHTDE8X2aIRgVy63e768G3266bO7x0XVSNJrtDobDAOHKv1i','agent',1,'2026-11-11 07:50:21','rahul','active',121,'UK-01',NULL,'[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Tasks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Email\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Universities\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Report Date Filter\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Report Employee Filter\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Report Status Filter\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false}]','[]',0,NULL),(132,1,1,1,'Deepa Nair','deepa.nair@trackboxcrm.com','7907052130','$2b$10$pNa2yAkduIRQrbdguw6olu4jE6I3AlgaVGXSFH/l9mb0TEv24q69.','agent',1,'2026-11-11 07:50:21','deepa','active',122,'UK-02',NULL,'[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Tasks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Email\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Universities\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Report Date Filter\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Report Employee Filter\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Report Status Filter\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true}]','[]',0,NULL),(502,1,1,1,'Priya Sharma','priya.sharma@trackboxcrm.com','9544554942','$2b$10$YuMxU1h/brwbXxozGmuJ2.SUB0.wyU6Puu9XlCMkNjyeZPiZnIwCm','manager',1,'2026-11-11 07:49:27','priya','active',402,'EMP-CAN-02','2024-09-01','[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Tasks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Email\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Universities\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true}]','[]',0,NULL),(507,1,2,2,'reas','',NULL,'$2b$10$kXExTKPzbXRpYMFHwDY9Vut9YFU.Za4kpEm.aXOU4twNZp6ycayUe','agent',1,'2026-11-26 11:56:06','res','active',NULL,NULL,NULL,NULL,'[]',0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_checklist_categories`
--

DROP TABLE IF EXISTS `visa_checklist_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_checklist_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `business_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vcc_business` (`business_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_checklist_categories`
--

LOCK TABLES `visa_checklist_categories` WRITE;
/*!40000 ALTER TABLE `visa_checklist_categories` DISABLE KEYS */;
INSERT INTO `visa_checklist_categories` VALUES (1,'Orientation','Pre-departure briefings, destination guides, and university orientations',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(2,'Travel','Flight bookings, itinerary verification, airline baggage and transit compliance',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(3,'Insurance','Health insurance (OSHC) and comprehensive travel medical coverage',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(4,'Housing','Accommodation arrangements, tenancy contracts, and address verification',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(5,'Finance','Forex cards, currency exchange, international banking, and living expense funds',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(6,'Transit','Airport pickup, transit transfers, and local transport connectivity',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(7,'Compliance','Offer letter, COE, passport validation, and visa grant conditions compliance',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(8,'Custom','Custom or institution-specific pre-departure requirements',1,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(9,'Orientation','Pre-departure briefings, destination guides, and university orientations',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(10,'Travel','Flight bookings, itinerary verification, airline baggage and transit compliance',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(11,'Insurance','Health insurance (OSHC) and comprehensive travel medical coverage',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(12,'Housing','Accommodation arrangements, tenancy contracts, and address verification',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(13,'Finance','Forex cards, currency exchange, international banking, and living expense funds',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(14,'Transit','Airport pickup, transit transfers, and local transport connectivity',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(15,'Compliance','Offer letter, COE, passport validation, and visa grant conditions compliance',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(16,'Custom','Custom or institution-specific pre-departure requirements',6,1,'2026-11-20 07:05:11','2026-11-20 07:05:11'),(17,'test',NULL,1,1,'2026-11-20 07:10:30','2026-11-20 07:10:30');
/*!40000 ALTER TABLE `visa_checklist_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_checklist_templates`
--

DROP TABLE IF EXISTS `visa_checklist_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_checklist_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'Pre-Departure',
  `description` varchar(255) DEFAULT NULL,
  `stage_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `business_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vct_business` (`business_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_checklist_templates`
--

LOCK TABLES `visa_checklist_templates` WRITE;
/*!40000 ALTER TABLE `visa_checklist_templates` DISABLE KEYS */;
INSERT INTO `visa_checklist_templates` VALUES (1,'Pre-Departure Briefing Session','Orientation','Mandatory pre-departure briefing and destination orientation',1,1,1,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(2,'Flight Ticket & Travel Booking Verification','Travel','Confirm itinerary, airline baggage limits, and transit arrangements',2,1,1,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(3,'Health Insurance (OSHC) & Travel Coverage','Insurance','Ensure policy active and valid for student & dependents',3,1,1,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(4,'Accommodation Arrangements & Address Confirmation','Housing','Confirm initial housing, landlord contact, and check-in dates',4,1,1,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(5,'Forex, Multi-currency Card & Bank Setup','Finance','Arrange international debit cards and initial living funds',5,1,1,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(6,'Airport Pickup & Transit Arrangements','Transit','Coordinate airport transfer and local transport passes',6,1,1,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(7,'Final Enrolment Pack & Document Compliance','Compliance','Verify offer letter, COE, passport, and entry visa grant notice',7,1,1,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(8,'Pre-Departure Briefing Session','Orientation','Mandatory pre-departure briefing and destination orientation',1,1,6,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(9,'Flight Ticket & Travel Booking Verification','Travel','Confirm itinerary, airline baggage limits, and transit arrangements',2,1,6,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(10,'Health Insurance (OSHC) & Travel Coverage','Insurance','Ensure policy active and valid for student & dependents',3,1,6,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(11,'Accommodation Arrangements & Address Confirmation','Housing','Confirm initial housing, landlord contact, and check-in dates',4,1,6,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(12,'Forex, Multi-currency Card & Bank Setup','Finance','Arrange international debit cards and initial living funds',5,1,6,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(13,'Airport Pickup & Transit Arrangements','Transit','Coordinate airport transfer and local transport passes',6,1,6,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(14,'Final Enrolment Pack & Document Compliance','Compliance','Verify offer letter, COE, passport, and entry visa grant notice',7,1,6,'2026-11-20 06:00:24','2026-11-20 06:00:24'),(15,'test122','test',NULL,8,1,1,'2026-11-20 07:10:43','2026-11-20 07:10:43');
/*!40000 ALTER TABLE `visa_checklist_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_history`
--

DROP TABLE IF EXISTS `visa_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `visa_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Submitted',
  `details` text,
  `visa_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `visa_id` (`visa_id`),
  KEY `contact_id` (`contact_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `visa_history_ibfk_1` FOREIGN KEY (`visa_id`) REFERENCES `visas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_history_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_history_ibfk_3` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_history`
--

LOCK TABLES `visa_history` WRITE;
/*!40000 ALTER TABLE `visa_history` DISABLE KEYS */;
INSERT INTO `visa_history` VALUES (17,12,859,70,'Visa case registered with status: AIP','Submitted','Visa case registered with status: AIP','2026-11-19','2026-11-19 08:55:32',NULL),(18,13,859,70,'Visa case registered with status: Withdrawn','Submitted','Visa case registered with status: Withdrawn','2026-11-19','2026-11-19 09:27:47',NULL);
/*!40000 ALTER TABLE `visa_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_reason_categories`
--

DROP TABLE IF EXISTS `visa_reason_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_reason_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `business_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vrc_business` (`business_id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_reason_categories`
--

LOCK TABLES `visa_reason_categories` WRITE;
/*!40000 ALTER TABLE `visa_reason_categories` DISABLE KEYS */;
INSERT INTO `visa_reason_categories` VALUES (1,'Financial Inadequacy / Funds Verification','Insufficient liquid funds, questionable source of wealth, or unverified deposits',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(2,'GTE / Genuine Student Requirement','Failure to convince case officer of intent to return, career roadmap gaps, or immigration risk',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(3,'Academic / Qualification Mismatch','Unexplained study gap, irrelevant past education, or low academic performance',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(4,'English Language Proficiency Requirement','IELTS/PTE score below threshold or suspicious language test verification',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(5,'Incomplete / Fraudulent Documentation','Missing bank statements, unverified employer reference, or documentation irregularities',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(6,'Medical / Character Requirement','Health issues, pending background clearances, or police certificate failure',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(7,'Country / Policy Restriction','Strict jurisdictional rejection quota or elevated risk tier embargo',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(8,'Other / Visa Officer Discretion','General discretionary refusal or miscellaneous high commission clauses',1,1,'2026-11-18 10:50:35','2026-11-18 10:50:35'),(25,'Financial Inadequacy / Funds Verification','Insufficient liquid funds, questionable source of wealth, or unverified deposits',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45'),(26,'GTE / Genuine Student Requirement','Failure to convince case officer of intent to return, career roadmap gaps, or immigration risk',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45'),(27,'Academic / Qualification Mismatch','Unexplained study gap, irrelevant past education, or low academic performance',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45'),(28,'English Language Proficiency Requirement','IELTS/PTE score below threshold or suspicious language test verification',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45'),(29,'Incomplete / Fraudulent Documentation','Missing bank statements, unverified employer reference, or documentation irregularities',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45'),(30,'Medical / Character Requirement','Health issues, pending background clearances, or police certificate failure',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45'),(31,'Country / Policy Restriction','Strict jurisdictional rejection quota or elevated risk tier embargo',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45'),(32,'Other / Visa Officer Discretion','General discretionary refusal or miscellaneous high commission clauses',6,1,'2026-11-18 12:01:45','2026-11-18 12:01:45');
/*!40000 ALTER TABLE `visa_reason_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_requests`
--

DROP TABLE IF EXISTS `visa_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `visa_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `request_type` varchar(100) NOT NULL DEFAULT 'RFI',
  `received_date` date NOT NULL,
  `due_date` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `details` text,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `assigned_task_id` int DEFAULT NULL,
  `document_name` varchar(255) DEFAULT NULL,
  `document_url` varchar(500) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vr_visa` (`visa_id`),
  KEY `idx_vr_contact` (`contact_id`),
  KEY `idx_vr_due` (`due_date`),
  KEY `idx_vr_status` (`status`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `visa_requests_ibfk_1` FOREIGN KEY (`visa_id`) REFERENCES `visas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_requests_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_requests_ibfk_3` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_requests`
--

LOCK TABLES `visa_requests` WRITE;
/*!40000 ALTER TABLE `visa_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `visa_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_statuses`
--

DROP TABLE IF EXISTS `visa_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT '#4f46e5',
  `stage_order` int DEFAULT '0',
  `description` varchar(255) DEFAULT NULL,
  `business_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `has_reason` tinyint(1) DEFAULT '0',
  `reason_category_ids` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vs_business` (`business_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_statuses`
--

LOCK TABLES `visa_statuses` WRITE;
/*!40000 ALTER TABLE `visa_statuses` DISABLE KEYS */;
INSERT INTO `visa_statuses` VALUES (19,'Preparation','#64748b',1,'Initial documentation and file setup',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(20,'Ready','#0284c7',2,'File complete and ready for submission',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(21,'Submitted','#2563eb',3,'Lodged with immigration authority',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(22,'Under Assessment','#7c3aed',4,'Case officer assigned and evaluating',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(23,'RFI-PPI','#d97706',5,'Official request for information / procedural fairness',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(24,'AIP','#0d9488',6,'Approval in principle received',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(25,'Approved','#16a34a',7,'Visa granted successfully',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(26,'Declined','#dc2626',8,'Visa refused or rejected',6,1,'2026-11-18 09:57:25','2026-11-18 10:39:51',1,NULL),(27,'Withdrawn','#475569',9,'Application withdrawn by applicant',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25',0,NULL),(29,'Preparation','#64748b',1,'Initial documentation and file setup',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL),(30,'Ready','#0284c7',2,'File complete and ready for submission',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL),(31,'Submitted','#2563eb',3,'Lodged with immigration authority',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL),(32,'Under Assessment','#7c3aed',4,'Case officer assigned and evaluating',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL),(33,'RFI-PPI','#d97706',5,'Official request for information / procedural fairness',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL),(34,'AIP','#0d9488',6,'Approval in principle received',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL),(35,'Approved','#16a34a',7,'Visa granted successfully',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL),(36,'Declined','#dc2626',8,'Visa refused or rejected',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',1,NULL),(37,'Withdrawn','#475569',9,'Application withdrawn by applicant',1,1,'2026-11-28 08:20:35','2026-11-28 08:20:35',0,NULL);
/*!40000 ALTER TABLE `visa_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_types`
--

DROP TABLE IF EXISTS `visa_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `business_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vt_business` (`business_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_types`
--

LOCK TABLES `visa_types` WRITE;
/*!40000 ALTER TABLE `visa_types` DISABLE KEYS */;
INSERT INTO `visa_types` VALUES (1,'Student Visa','Primary study and higher education visa',1,1,'2026-11-18 09:12:14','2026-11-18 09:12:14'),(2,'Dependent Visa','Spouse or child dependent visa linked to student/work permit',1,1,'2026-11-18 09:12:14','2026-11-18 09:12:14'),(3,'Work Visa','Post-graduate or employer sponsored work authorization',1,1,'2026-11-18 09:12:14','2026-11-18 09:12:14'),(4,'Visitor / Tourist','Short-term travel or visitor exploration visa',1,1,'2026-11-18 09:12:14','2026-11-18 09:12:14'),(5,'Post-Study Work','Post study graduate work visa stream',1,1,'2026-11-18 09:12:14','2026-11-18 09:12:14'),(6,'Permanent Residency','Permanent residency or settlement stream',1,1,'2026-11-18 09:12:14','2026-11-18 09:12:14'),(7,'Other','Custom or miscellaneous visa subclass',1,0,'2026-11-18 09:12:14','2026-11-18 09:39:34'),(15,'Student Visa','Primary study and higher education visa',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25'),(16,'Dependent Visa','Spouse or child dependent visa linked to student/work permit',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25'),(17,'Work Visa','Post-graduate or employer sponsored work authorization',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25'),(18,'Visitor / Tourist','Short-term travel or visitor exploration visa',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25'),(19,'Post-Study Work','Post study graduate work visa stream',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25'),(20,'Permanent Residency','Permanent residency or settlement stream',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25'),(21,'Other','Custom or miscellaneous visa subclass',6,1,'2026-11-18 09:57:25','2026-11-18 09:57:25'),(22,'tst',NULL,1,1,'2026-11-19 09:28:48','2026-11-19 09:28:48');
/*!40000 ALTER TABLE `visa_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visas`
--

DROP TABLE IF EXISTS `visas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `business_id` int NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Preparation',
  `visa_date` date DEFAULT NULL,
  `description` text,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `visa_type` varchar(100) DEFAULT 'Student Visa',
  `application_no` varchar(100) DEFAULT NULL,
  `assigned_staff_id` int DEFAULT NULL,
  `assigned_staff_name` varchar(255) DEFAULT NULL,
  `submission_date` date DEFAULT NULL,
  `officer_name` varchar(255) DEFAULT NULL,
  `officer_contact` varchar(255) DEFAULT NULL,
  `extension_requested_date` date DEFAULT NULL,
  `extension_approved_date` date DEFAULT NULL,
  `extension_notes` text,
  `outcome_date` date DEFAULT NULL,
  `outcome_notes` text,
  `decline_category` varchar(100) DEFAULT NULL,
  `decline_detailed_notes` text,
  `visa_expiry_date` date DEFAULT NULL,
  `travel_date` date DEFAULT NULL,
  `intake_date` date DEFAULT NULL,
  `pre_departure_triggered` tinyint(1) DEFAULT '0',
  `pre_departure_data` json DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `is_delete` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `visas_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visas_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visas_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visas`
--

LOCK TABLES `visas` WRITE;
/*!40000 ALTER TABLE `visas` DISABLE KEYS */;
INSERT INTO `visas` VALUES (12,859,'Anas','918592873809',1,'AIP','2026-11-19',NULL,70,'2026-11-19 08:55:32','2026-11-19 08:55:32','Post-Study Work','234',502,'Priya Sharma','2026-11-19',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'[{\"id\": \"pda_1\", \"done\": false, \"notes\": \"\", \"title\": \"Pre-Departure Briefing Session\", \"completed_at\": null}, {\"id\": \"pda_2\", \"done\": false, \"notes\": \"\", \"title\": \"Flight Ticket & Travel Booking Verification\", \"completed_at\": null}, {\"id\": \"pda_3\", \"done\": false, \"notes\": \"\", \"title\": \"Health Insurance (OSHC) & Travel Coverage\", \"completed_at\": null}, {\"id\": \"pda_4\", \"done\": false, \"notes\": \"\", \"title\": \"Accommodation Arrangements & Address Confirmation\", \"completed_at\": null}, {\"id\": \"pda_5\", \"done\": false, \"notes\": \"\", \"title\": \"Forex, Multi-currency Card & Bank Setup\", \"completed_at\": null}, {\"id\": \"pda_6\", \"done\": false, \"notes\": \"\", \"title\": \"Airport Pickup & Transit Arrangements\", \"completed_at\": null}, {\"id\": \"pda_7\", \"done\": false, \"notes\": \"\", \"title\": \"Final Enrolment Pack & Document Compliance\", \"completed_at\": null}]',0,0,NULL),(13,859,'Anas','918592873809',1,'Withdrawn','2026-11-19',NULL,70,'2026-11-19 09:27:47','2026-11-20 07:10:55','Student Visa','',502,'Priya Sharma','2026-11-19',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'[{\"id\": \"template_1\", \"done\": true, \"notes\": \"\", \"title\": \"Pre-Departure Briefing Session\", \"category\": \"Orientation\", \"description\": \"Mandatory pre-departure briefing and destination orientation\", \"template_id\": 1, \"completed_at\": \"2026-11-20T06:39:05.798Z\"}, {\"id\": \"template_2\", \"done\": true, \"notes\": \"\", \"title\": \"Flight Ticket & Travel Booking Verification\", \"category\": \"Travel\", \"description\": \"Confirm itinerary, airline baggage limits, and transit arrangements\", \"template_id\": 2, \"completed_at\": \"2026-11-20T06:38:40.230Z\"}, {\"id\": \"template_3\", \"done\": true, \"notes\": \"\", \"title\": \"Health Insurance (OSHC) & Travel Coverage\", \"category\": \"Insurance\", \"description\": \"Ensure policy active and valid for student & dependents\", \"template_id\": 3, \"completed_at\": \"2026-11-20T06:38:40.662Z\"}, {\"id\": \"template_4\", \"done\": true, \"notes\": \"\", \"title\": \"Accommodation Arrangements & Address Confirmation\", \"category\": \"Housing\", \"description\": \"Confirm initial housing, landlord contact, and check-in dates\", \"template_id\": 4, \"completed_at\": \"2026-11-20T06:38:41.148Z\"}, {\"id\": \"template_5\", \"done\": true, \"notes\": \"\", \"title\": \"Forex, Multi-currency Card & Bank Setup\", \"category\": \"Finance\", \"description\": \"Arrange international debit cards and initial living funds\", \"template_id\": 5, \"completed_at\": \"2026-11-20T06:38:42.045Z\"}, {\"id\": \"template_6\", \"done\": true, \"notes\": \"\", \"title\": \"Airport Pickup & Transit Arrangements\", \"category\": \"Transit\", \"description\": \"Coordinate airport transfer and local transport passes\", \"template_id\": 6, \"completed_at\": \"2026-11-20T06:38:42.400Z\"}, {\"id\": \"template_7\", \"done\": true, \"notes\": \"\", \"title\": \"Final Enrolment Pack & Document Compliance\", \"category\": \"Compliance\", \"description\": \"Verify offer letter, COE, passport, and entry visa grant notice\", \"template_id\": 7, \"completed_at\": \"2026-11-20T06:38:43.038Z\"}, {\"id\": \"template_15\", \"done\": true, \"notes\": \"\", \"title\": \"test122\", \"category\": \"test\", \"description\": \"\", \"template_id\": 15, \"completed_at\": \"2026-11-20T07:10:55.766Z\"}]',0,0,NULL);
/*!40000 ALTER TABLE `visas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_widgets`
--

DROP TABLE IF EXISTS `website_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_widgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `chatbot_id` int DEFAULT NULL,
  `widget_name` varchar(255) DEFAULT NULL,
  `welcome_message` text,
  `brand_color` varchar(7) DEFAULT '#25D366',
  `position` enum('bottom-right','bottom-left') DEFAULT 'bottom-right',
  `allowed_domains` text,
  `widget_token` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widget_token` (`widget_token`),
  KEY `business_id` (`business_id`),
  KEY `chatbot_id` (`chatbot_id`),
  CONSTRAINT `website_widgets_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `website_widgets_ibfk_2` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbots` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_widgets`
--

LOCK TABLES `website_widgets` WRITE;
/*!40000 ALTER TABLE `website_widgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `website_widgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_messages`
--

DROP TABLE IF EXISTS `whatsapp_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `direction` enum('inbound','outbound') NOT NULL DEFAULT 'inbound',
  `wa_message_id` varchar(150) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'delivered',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_business_id` (`business_id`),
  KEY `idx_wa_message_id` (`wa_message_id`),
  CONSTRAINT `fk_whatsapp_messages_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_whatsapp_messages_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_whatsapp_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_messages`
--

LOCK TABLES `whatsapp_messages` WRITE;
/*!40000 ALTER TABLE `whatsapp_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_qr_sessions`
--

DROP TABLE IF EXISTS `whatsapp_qr_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_qr_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `user_id` int DEFAULT NULL,
  `business_id` int DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `creds_json` longtext,
  `status` enum('pending','connected','disconnected') DEFAULT 'pending',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  UNIQUE KEY `uq_wqr_user_id` (`user_id`),
  KEY `idx_wqr_phone` (`phone_number`),
  KEY `idx_wqr_user` (`user_id`),
  CONSTRAINT `whatsapp_qr_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_qr_sessions`
--

LOCK TABLES `whatsapp_qr_sessions` WRITE;
/*!40000 ALTER TABLE `whatsapp_qr_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_qr_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `years`
--

DROP TABLE IF EXISTS `years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `business_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `years`
--

LOCK TABLES `years` WRITE;
/*!40000 ALTER TABLE `years` DISABLE KEYS */;
/*!40000 ALTER TABLE `years` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-28 14:07:01
