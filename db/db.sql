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
-- Table structure for table `application_histories`
--

DROP TABLE IF EXISTS `application_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `changes` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `application_id` (`application_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `application_histories_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `application_histories_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_histories`
--

LOCK TABLES `application_histories` WRITE;
/*!40000 ALTER TABLE `application_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_histories` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_history`
--

LOCK TABLES `application_history` WRITE;
/*!40000 ALTER TABLE `application_history` DISABLE KEYS */;
INSERT INTO `application_history` VALUES (9,7,NULL,'Application Created','Initial application created.','2026-08-31 04:19:27'),(10,7,NULL,'Application Updated','Status changed from \'PENDING \' to \'approved\'','2026-08-31 12:36:53'),(11,8,NULL,'Application Created','Initial application created.','2026-08-31 12:38:27'),(12,9,NULL,'Application Created','Initial application created.','2026-08-31 12:39:09'),(37,7,NULL,'Application Created','Initial application created.','2026-10-21 08:37:23'),(38,8,NULL,'Application Created','Initial application created.','2026-10-21 08:37:49'),(39,9,NULL,'Application Created','Initial application created.','2026-10-21 08:38:12'),(46,1,1,'Application Created','Initial application created.','2026-10-29 11:40:19'),(47,1,1,'Application Updated','Status changed from \'Applied\' to \'Enrolled/Travelled\'','2026-10-29 11:49:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_status_change`
--

LOCK TABLES `application_status_change` WRITE;
/*!40000 ALTER TABLE `application_status_change` DISABLE KEYS */;
INSERT INTO `application_status_change` VALUES (6,7,'2026-10-21 14:07:23',NULL,NULL,6,'Visa Applied ',NULL,'2026-10-21 08:37:23'),(7,8,'2026-10-21 14:07:49',NULL,NULL,7,'Visa Received',NULL,'2026-10-21 08:37:49'),(8,9,'2026-10-21 14:08:12',NULL,NULL,8,'Enrolled/Travelled',NULL,'2026-10-21 08:38:12'),(13,1,'2026-10-29 17:10:19',NULL,NULL,4,'Applied',1,'2026-10-29 11:40:19'),(14,1,'2026-10-29 17:19:54',4,'Applied',8,'Enrolled/Travelled',1,'2026-10-29 11:49:54');
/*!40000 ALTER TABLE `application_status_change` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_status_changes`
--

DROP TABLE IF EXISTS `application_status_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_status_changes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `status_change_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `old_status_id` int DEFAULT NULL,
  `old_status_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status_id` int NOT NULL,
  `new_status_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` int DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_application_id` (`application_id`),
  KEY `idx_status_change_date` (`status_change_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_status_changes`
--

LOCK TABLES `application_status_changes` WRITE;
/*!40000 ALTER TABLE `application_status_changes` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_status_changes` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_statuses`
--

LOCK TABLES `application_statuses` WRITE;
/*!40000 ALTER TABLE `application_statuses` DISABLE KEYS */;
INSERT INTO `application_statuses` VALUES (4,1,'Applied','#10B981',1,'2026-10-21 06:01:42'),(5,1,'Offer received','#ece513',1,'2026-10-21 06:02:03'),(6,1,'Visa Applied ','#61caff',1,'2026-10-21 06:02:25'),(7,1,'Visa Received','#38ff3b',1,'2026-10-21 06:02:47'),(8,1,'Enrolled/Travelled','#ffdda3',1,'2026-10-21 06:47:33');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (1,1,'New Zealand','o','Diploma in Web Development',NULL,NULL,8,'',NULL,'2026-10-29 11:40:19','2026-10-30 10:11:55',136);
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
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_logs`
--

LOCK TABLES `attendance_logs` WRITE;
/*!40000 ALTER TABLE `attendance_logs` DISABLE KEYS */;
INSERT INTO `attendance_logs` VALUES (5,1,1,'Admin User','lead','2026-07-11 03:50:00','2026-07-13 07:00:08',28,1,'late lead','Completed','2026-07-11 03:50:00'),(6,1,1,'Admin User','crm','2026-07-13 06:31:39','2026-07-13 07:00:12',28,1,'hugiuughi','Completed','2026-07-13 06:31:39'),(7,1,1,'Admin User','operation','2026-07-13 06:31:59','2026-07-13 07:00:16',28,0,NULL,'Completed','2026-07-13 06:31:59'),(40,1,1,'Admin User','lead','2026-07-13 03:30:00','2026-07-13 04:15:00',45,0,NULL,'Completed','2026-07-13 03:30:00'),(41,1,1,'Admin User','crm','2026-07-13 04:30:00','2026-07-13 05:20:00',50,1,'Customer meeting','Completed','2026-07-13 04:30:00'),(42,1,1,'Admin User','operation','2026-07-13 05:30:00','2026-07-13 06:45:00',75,0,NULL,'Completed','2026-07-13 05:30:00'),(43,1,1,'Admin User','hr','2026-07-13 07:30:00','2026-07-13 07:24:16',-6,0,NULL,'Completed','2026-07-13 07:30:00'),(56,1,1,'Admin User','lead','2026-07-14 04:38:01','2026-07-14 04:38:06',0,0,NULL,'Completed','2026-07-14 04:38:01'),(57,1,1,'Admin User','crm','2026-07-31 17:53:46','2026-07-31 17:54:32',0,1,'health issue','Completed','2026-07-31 17:53:46'),(58,1,1,'Admin User','crm','2026-08-03 05:42:16','2026-08-03 06:29:37',47,0,NULL,'Completed','2026-08-03 05:42:16'),(60,1,1,'Admin User','crm','2026-08-03 06:29:42','2026-08-19 07:03:15',23073,0,NULL,'Completed','2026-08-03 06:29:42'),(61,1,1,'Admin User','crm','2026-08-21 08:19:49','2026-10-14 10:03:22',77863,1,'health issue','Completed','2026-08-21 08:19:49'),(63,1,1,'Admin User','crm','2026-10-14 10:03:34','2026-10-14 10:03:46',0,1,'u','Completed','2026-10-14 10:03:34'),(64,1,1,'Admin User','crm','2026-10-20 10:26:44','2026-10-20 10:26:51',0,1,'t','Completed','2026-10-20 10:26:44'),(65,1,1,'Admin User','crm','2026-10-28 10:25:49','2026-10-28 10:26:08',0,1,'fgh','Completed','2026-10-28 10:25:49');
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (16,'Angamaly',NULL,NULL,NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(17,'Kalady',NULL,NULL,NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34');
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businesses`
--

LOCK TABLES `businesses` WRITE;
/*!40000 ALTER TABLE `businesses` DISABLE KEYS */;
INSERT INTO `businesses` VALUES (1,'Demo Business','+1(555)637-7030',NULL,NULL,'EAASQM6HaNasBRSAmEcWeP7bWf74YLqZCsaZAsuN3r246owpJAyRGqK3jqfykKBMugvF3Jw9ELwu3t9O1RZCP9UFpfkZAwbierKf2POmaI7DlAR9zZBY7UuCUFbo7UW1NC4vgYZBcfO343LMyqJu4wjQr3IIQDGeeh3znLHZCbcoYnEzrbZAyDIX5asTuPrsVVhsa0GflncIpQhlk7CAPj3ufr6SGHXeVjT3KEI8Tfg33RTkog3eaQCqxGFjj7dPmVABvz3TqcRIy8k7Qb7H2z0jO','1010252335515897','12345','pro','pending','2026-04-29 08:59:39'),(2,'chillie','4525251234567890-',NULL,NULL,NULL,NULL,NULL,'starter','pending','2026-04-29 09:03:55'),(3,'chillie','9048501094',NULL,NULL,NULL,NULL,NULL,'starter','pending','2026-04-29 10:17:21'),(4,'chilli & Co','9048501094',NULL,NULL,NULL,NULL,NULL,'starter','pending','2026-04-30 03:47:18'),(5,'QA Test Business','+1234567890',NULL,NULL,NULL,NULL,NULL,'starter','pending','2026-08-22 09:44:25');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channels`
--

LOCK TABLES `channels` WRITE;
/*!40000 ALTER TABLE `channels` DISABLE KEYS */;
INSERT INTO `channels` VALUES (1,1,'GOOGLE ADS','2026-10-30 12:31:11','2026-10-30 12:31:11'),(2,1,'INSTAGRAM','2026-10-30 12:31:11','2026-10-30 12:31:11'),(3,1,'LINKDIN','2026-10-30 12:31:11','2026-10-30 12:31:11'),(4,1,'OTHERS','2026-10-30 12:31:11','2026-10-30 12:31:11'),(5,1,'REFERRALS','2026-10-30 12:31:11','2026-10-30 12:31:11'),(6,1,'TWITER','2026-10-30 12:31:11','2026-10-30 12:31:11'),(7,1,'WEBSITE','2026-10-30 12:31:11','2026-10-30 12:31:11'),(8,1,'WHATS APP','2026-10-30 12:31:11','2026-10-30 12:31:11');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbots`
--

LOCK TABLES `chatbots` WRITE;
/*!40000 ALTER TABLE `chatbots` DISABLE KEYS */;
INSERT INTO `chatbots` VALUES (1,1,'Main Support Bot','[\"hi\", \"hello\", \"help\", \"start\"]','{\"edges\": [], \"nodes\": [{\"id\": \"start\", \"next\": \"collect_choice\", \"type\": \"message\", \"content\": \"Welcome! How can I help you today?\\n1. Support\\n2. Sales\\n3. Track Order\"}, {\"id\": \"collect_choice\", \"next\": \"route\", \"type\": \"collect_input\", \"content\": \"Please type your choice (1/2/3)\"}, {\"id\": \"route\", \"type\": \"condition\", \"rules\": [{\"next\": \"support\", \"match\": \"1\"}, {\"next\": \"sales\", \"match\": \"2\"}, {\"next\": \"track\", \"match\": \"3\"}], \"default\": \"end\"}, {\"id\": \"support\", \"next\": \"end\", \"type\": \"message\", \"content\": \"Connecting you to our support team. Please wait...\"}, {\"id\": \"sales\", \"next\": \"end\", \"type\": \"message\", \"content\": \"Our sales team will contact you shortly!\"}, {\"id\": \"track\", \"next\": \"end\", \"type\": \"message\", \"content\": \"Please share your order number and we will update you.\"}, {\"id\": \"end\", \"type\": \"end\", \"content\": \"Thank you for contacting us!\"}]}',0,NULL,1,'whatsapp','2026-04-29 08:59:39'),(2,1,'sales helper','[\"hi\", \"hello\", \"hii\", \"hey\"]','{\"edges\": [], \"nodes\": []}',1,NULL,0,'whatsapp','2026-05-05 04:03:41');
/*!40000 ALTER TABLE `chatbots` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_history`
--

LOCK TABLES `contact_history` WRITE;
/*!40000 ALTER TABLE `contact_history` DISABLE KEYS */;
INSERT INTO `contact_history` VALUES (1,136,1,1,'follow_up_date','2026-10-20','2026-10-21','2026-10-21 04:35:08'),(2,135,1,1,'follow_up_date','2026-10-20','2026-10-21','2026-10-21 04:35:13'),(3,136,1,1,'follow_up_date','2026-10-20','2026-10-21','2026-10-21 04:40:09'),(4,135,1,1,'follow_up_date','2026-10-20','2026-10-21','2026-10-21 04:40:17'),(9,136,1,1,'follow_up_date','2026-10-28','2026-10-29','2026-10-29 11:29:19'),(10,136,1,1,'follow_up_date','2026-10-28','2026-10-29','2026-10-29 11:29:31'),(11,136,1,1,'follow_up_date','2026-10-28','2026-10-29','2026-10-29 11:29:54'),(12,136,1,1,'follow_up_date','2026-10-28','2026-10-29','2026-10-29 11:39:59'),(13,136,1,1,'follow_up_date','2026-10-28','2026-10-30','2026-10-30 05:32:58'),(14,136,1,1,'follow_up_date','2026-10-29','2026-10-31','2026-10-30 05:33:08'),(15,136,1,1,'follow_up_date','2026-10-29',NULL,'2026-10-30 05:33:59'),(16,136,1,1,'follow_up_date',NULL,'2026-10-30','2026-10-30 05:34:07'),(17,136,1,1,'follow_up_date','2026-10-29','2026-10-30','2026-10-30 06:20:57'),(21,136,1,1,'follow_up_date','2026-10-29','2026-11-06','2026-10-30 11:39:43'),(22,136,1,1,'follow_up_date','2026-11-05','2026-11-06','2026-10-30 12:26:25');
/*!40000 ALTER TABLE `contact_history` ENABLE KEYS */;
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
  `email` varchar(255) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `opted_in` tinyint(1) DEFAULT '0',
  `opt_in_date` timestamp NULL DEFAULT NULL,
  `opt_out_date` timestamp NULL DEFAULT NULL,
  `opt_in_source` enum('manual','link','whatsapp','import') DEFAULT 'manual',
  `channel_preference` varchar(100) DEFAULT 'whatsapp',
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
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `fk_contacts_assigned_to` (`assigned_to`),
  KEY `fk_contacts_enquiry_for` (`enquiry_for_id`),
  KEY `fk_contacts_probability` (`probability_id`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `fk_contacts_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contacts_enquiry_for` FOREIGN KEY (`enquiry_for_id`) REFERENCES `enquiry_fors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contacts_probability` FOREIGN KEY (`probability_id`) REFERENCES `probabilities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=138 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,1,'Anil Paul','918086041647',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(2,1,'Christy Thomas','917012759032',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(3,1,'Mereena Sebastian','918593949792',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,'Manickamangalam',NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(4,1,'ARYA UNNI','919207455251',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,'Okkal',NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(5,1,'Anju Shaibu','919207029389',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,'Neeleeswaram',NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(6,1,'Mathews P cheriyan','918330029196',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(7,1,'Melvin Michael','918606039481',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(8,1,'Stefin father','918921288868',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(9,1,'Alisha Jose','919946627099',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(10,1,'Dona Mary Davis','916238275944',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(11,1,'Anna K Thomas','919544369627',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(12,1,'Albin Nixon','919072633714',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(13,1,'Amal Krishna Pradeep','918075410272',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(14,1,'Christo','919745725409',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(15,1,'Anto','917025582957',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(16,1,'Akhila','919846398306',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(17,1,'Jelin','917025787305',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(18,1,'Jithin Kunjumon','917306876153',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(19,1,'Albin Mathew','917736804609',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(20,1,'Avitha','917034214892',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,'thrissur',NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(21,1,'Nithul Biju','919947107688',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(22,1,'Jomel P Sasi','919746802512',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(23,1,'Midhu','917510720372',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(24,1,'bibin baby','918891301607',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(25,1,'Nithin','916235054380',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,'Chalakudy',NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(26,1,'Aldrin Wilson','918590960749',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(27,1,'pournamy v s','919947953642',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(28,1,'JITHIN','917559936024',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(29,1,'ALAN M V','918714368015',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(30,1,'Veronica K','917902790819',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(31,1,'swetha Reji','917356100242',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(32,1,'kishore','918281882297',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(33,1,'Alen sabu','917907699924',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(34,1,'Simil Benny','918139014854',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(35,1,'Jeswin Shaju','916238139781',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(36,1,'parvathy poulouse','919562629824',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(37,1,'ann mariya devassy','919207393002',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(38,1,'MARIYA','917025652243',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(39,1,'Parvathy','918075421319',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(40,1,'Alex babu','917306760857',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(41,1,'jisiya','919544075107',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(42,1,'Athul roy','919745824639',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(43,1,'festin francis','918136847799',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(44,1,'Arjun Saji','917907970712',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(45,1,'amal eldhose','919656917369',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(46,1,'sujay anil','916238921929',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(47,1,'antonio','919995136859',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(48,1,'shahin','917293043123',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(49,1,'Adarsh','917561806345',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(50,1,'nash A o','919207053054',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(51,1,'reebish santhosh','919995259776',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(52,1,'Aparna Alias','918590470630',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(53,1,'nibin john','918089634476',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(54,1,'Nakul gopinath','918848528025',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(55,1,'Eldho George','919496336332',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(56,1,'josiya','918157085147',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(57,1,'Neena Mathew','918111938061',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(58,1,'Dhiya Rose','917356749374',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(59,1,'Sherine Shaju','917736097450',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(60,1,'Renjith T.A','917994242294',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(61,1,'charles george','916235928027',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(62,1,'john peter','918921319217',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(63,1,'Akash','918985964850',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(64,1,'silpa','918921588848',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(65,1,'Maria Rose Joy','916238199308',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(66,1,'Sujil Mathew','919495539298',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(67,1,'Sanju Sabu','919946613952',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(68,1,'Jerin Joy','917306072036',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(69,1,'Dini K Davis','919947343239',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(70,1,'Emmanuel Xavier','919188105919',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(71,1,'Anette Joy','918848922735',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(72,1,'Christal Biju','918606074191',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(73,1,'Tom Sebastian','917594914948',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(74,1,'Athul Pramond','918089994154',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(75,1,'Mohammed Shanif','917561034827',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(76,1,'Alen Mathew Paul','918129195563',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(77,1,'Anjana Suku','919995117694',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(78,1,'Devika PV','917736241897',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(79,1,'Ananthu MK','918075531696',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(80,1,'Mebin Benny','917510151304',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(81,1,'JEZEBEL MERLIN','919995366699',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(82,1,'grace helen','916235681421',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(83,1,'dinu denny','916282373018',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(84,1,'mariya sony','919744467561',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(85,1,'Aleena biju','917025486201',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(86,1,'Benjammin Benny','917306480425',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(87,1,'prince cleetus','916238719423',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(88,1,'Heaven christo','919567715403',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(89,1,'Leads - JULY',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(90,1,'Darsana C.S','919562941995',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(91,1,'Andriya Baby','918848918012',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(92,1,'Denil K Thoman','919447015393',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(93,1,'Ananya Shijo','919142131108',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(94,1,'John Saju','918590499317',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(95,1,'Gaius Rajan','919447362491',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(96,1,'Wilston P Wilson','917736412437',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(97,1,'Niya Tomy','918547736939',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(98,1,'Sial P Raju','919961108841',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(99,1,'Sanoop Babu','917306028646',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(100,1,'Jerin Joy','919633270255',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(101,1,'Leads - AUGUST',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(102,1,'AKHIL BIJU',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(103,1,'JOYAL SYJAN',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(104,1,'BONY RARICHAN',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(105,1,'GIFTY TOMY',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(106,1,'GHOSHMON M G',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(107,1,'ANIL K A',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(108,1,'ANILA JOHNSON',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(109,1,'ASWIN POTTEPARAMBIL',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(110,1,'YESHWIN SABU',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(111,1,'RENJITH',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(112,1,'GIFTY V D FOR PTE COACHING',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(113,1,'MERIN ROSE',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(114,1,'GODWIN T PAULSON',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(115,1,'SELBIN JOHN',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(116,1,'Leads - September',NULL,NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(117,1,'Dhanya Louis','919946980757',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(118,1,'Aswin Shaji','916282704096',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(119,1,'Rose Mary Benny','916235768247',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(120,1,'Sneha Mary Varghese','917028713469',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(121,1,'Libin Joseph','918281065205',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(122,1,'Abhiesk A','919633785881',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(123,1,'Kavya Murali','918590337710',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(124,1,'Tinu Yohannan','918606019562',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(125,1,'Namrutha P','919544758662',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(126,1,'Mary Anjana Antony','919061660862',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(127,1,'Akshay Rajendran','919207926995',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(128,1,'Dibin Biju','919846079560',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(129,1,'Denil Joy','918304010349',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(130,1,'Aparna V','919061433009',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(131,1,'Melissa Jaiby','916363689904',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(132,1,'Balamuralikrishna','919746380879',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(133,1,'Nandana Surendran','918086836374',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(134,1,'Albin Reji','919995154072',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(135,1,'Abhijith Siju','918943391979',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',58,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',26,'PENDING',0,'2026-10-29',1,0,NULL,NULL,0,NULL,NULL,1,'[58]',NULL,NULL,0),(136,1,'Anas','918592873809',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-10-29 09:47:47',59,NULL,NULL,NULL,16,'Angamaly',31,'Marketing',2,'Positive',12,'2026-11-06',1,1,'2026-10-30 17:56:26',59,0,NULL,NULL,1,'[58, \"59\"]',NULL,NULL,1);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (38,'MCA in Artificial Intelligence',150000.00,'48','MCA in Artificial Intelligence Course Description\nThe MCA in Artificial Intelligence course is designed to provide students with a comprehensive understanding of AI concepts, techniques, and applications. The curriculum includes:\nCore AI concepts and advanced algorithms\nData mining techniques and neural networks\nDeep learning architectures and AI ethics\nProficiency in programming languages like Python\nStrong mathematical skills including linear algebra, calculus, and probability\nStudents will engage in practical projects and real-world applications to build their expertise in AI. The program also emphasizes critical thinking, problem-solving skills, and communication abilities, which are essential for success in AI-driven roles','2026-08-10 08:31:40','2026-08-10 08:31:40'),(39,'Diploma in Web Development',25000.00,'6','Learn HTML, CSS, JavaScript, and full-stack web development from scratch.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(40,'Python Programming Certification',12000.00,'3','Master Python fundamentals, OOP concepts, and hands-on coding projects.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(41,'Data Science & Machine Learning',55000.00,'9','Comprehensive course covering statistics, Python, ML algorithms, and real-world data projects.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(42,'Digital Marketing Professional',18000.00,'4','Learn SEO, SEM, social media marketing, content strategy, and analytics.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(43,'Graphic Design Masterclass',20000.00,'5','Master Adobe Photoshop, Illustrator, and design principles for print and digital media.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(44,'Advanced Excel & Data Analysis',8000.00,'2','Hands-on training in formulas, pivot tables, dashboards, and data visualization.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(45,'Java Full Stack Development',45000.00,'8','In-depth training in Java, Spring Boot, REST APIs, and front-end frameworks.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(46,'UI/UX Design Fundamentals',22000.00,'4','Learn user research, wireframing, prototyping, and design tools like Figma.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(47,'Cloud Computing with AWS',35000.00,'6','Gain hands-on experience with AWS services, cloud architecture, and deployment.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(48,'Cybersecurity Essentials',30000.00,'6','Understand network security, ethical hacking basics, and threat management.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(49,'Android App Development',28000.00,'5','Build Android apps using Kotlin, Android Studio, and modern app architecture.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(50,'iOS App Development with Swift',30000.00,'5','Learn Swift, Xcode, and how to design and publish iOS applications.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(51,'React JS Development',16000.00,'3','Build dynamic single-page applications using React, hooks, and state management.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(52,'Node.js Backend Development',15000.00,'3','Learn server-side development with Node.js, Express, and REST APIs.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(53,'DevOps Engineering',38000.00,'6','Master CI/CD pipelines, Docker, Kubernetes, and infrastructure automation.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(54,'Artificial Intelligence Fundamentals',40000.00,'6','Introduction to AI concepts, neural networks, and practical AI applications.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(55,'Business Analytics',20000.00,'4','Learn data-driven decision making using Excel, SQL, and Power BI.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(56,'SQL & Database Management',10000.00,'2','Master relational databases, SQL queries, and database design principles.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(57,'Content Writing & Copywriting',9000.00,'2','Develop persuasive writing skills for blogs, ads, and marketing content.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(58,'Financial Accounting Basics',14000.00,'3','Learn bookkeeping, financial statements, and accounting fundamentals.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(59,'Human Resource Management',17000.00,'4','Cover recruitment, employee relations, payroll, and HR compliance.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(60,'Project Management Professional (PMP) Prep',25000.00,'3','Prepare for PMP certification with project planning and risk management concepts.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(61,'Spoken English & Communication Skills',6000.00,'2','Improve fluency, pronunciation, and professional communication skills.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(62,'Interior Design Diploma',42000.00,'8','Learn space planning, 3D modeling, and interior design principles.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(63,'Fashion Designing Course',50000.00,'12','Comprehensive training in garment design, pattern making, and fashion illustration.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(64,'Photography & Videography',15000.00,'3','Master camera techniques, composition, lighting, and video editing.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(65,'Animation & VFX',60000.00,'12','Learn 2D/3D animation, visual effects, and industry-standard software.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(66,'Ethical Hacking Certification',32000.00,'4','Hands-on training in penetration testing and vulnerability assessment.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(67,'Blockchain Development',36000.00,'5','Understand blockchain fundamentals, smart contracts, and DApp development.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(68,'Culinary Arts & Baking',27000.00,'6','Professional training in cooking techniques, baking, and kitchen management.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(69,'mCOm',3000.00,'4month','new','2026-10-30 10:04:35','2026-10-30 10:04:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (29,16,'Admissions',NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(30,16,'Application',NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(31,16,'Marketing',NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(32,16,'Visa',NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(36,17,'Counsellors',NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(37,17,'Applications',NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(38,17,'Visa',NULL,'2026-10-29 09:42:34','2026-10-29 09:42:34'),(39,16,'Manager',NULL,'2026-10-29 09:45:52','2026-10-29 09:45:52'),(40,17,'Manager',NULL,'2026-10-29 09:46:09','2026-10-29 09:46:09');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (2,1,'PASSPORT',NULL,'2026-08-21 06:40:06'),(3,1,'AADHAR CARD',NULL,'2026-08-21 06:40:17');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_fors`
--

LOCK TABLES `enquiry_fors` WRITE;
/*!40000 ALTER TABLE `enquiry_fors` DISABLE KEYS */;
INSERT INTO `enquiry_fors` VALUES (10,1,'EDUCATION','2026-08-21 06:39:06'),(11,1,'SUPPORT','2026-08-21 06:39:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `field_categories`
--

LOCK TABLES `field_categories` WRITE;
/*!40000 ALTER TABLE `field_categories` DISABLE KEYS */;
INSERT INTO `field_categories` VALUES (3,1,'EDUCATIONS','2026-08-21 07:54:08'),(4,1,'ABOUT ','2026-08-21 07:54:20'),(5,1,'PERSONAL INFO','2026-08-21 07:54:32'),(8,1,'PTE','2026-10-06 07:39:55');
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
) ENGINE=InnoDB AUTO_INCREMENT=306 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups`
--

LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
INSERT INTO `follow_ups` VALUES (1,1,'Anil Paul','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(2,2,'Christy Thomas','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(3,3,'Mereena Sebastian','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(4,4,'ARYA UNNI','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(5,5,'Anju Shaibu','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(6,6,'Mathews P cheriyan','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(7,7,'Melvin Michael','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(8,8,'Stefin father','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(9,9,'Alisha Jose','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(10,10,'Dona Mary Davis','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(11,11,'Anna K Thomas','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(12,12,'Albin Nixon','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(13,13,'Amal Krishna Pradeep','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(14,14,'Christo','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(15,15,'Anto','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(16,16,'Akhila','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(17,17,'Jelin','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(18,18,'Jithin Kunjumon','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(19,19,'Albin Mathew','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(20,20,'Avitha','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(21,21,'Nithul Biju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(22,22,'Jomel P Sasi','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(23,23,'Midhu','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(24,24,'bibin baby','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(25,25,'Nithin','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(26,26,'Aldrin Wilson','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(27,27,'pournamy v s','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(28,28,'JITHIN','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(29,29,'ALAN M V','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(30,30,'Veronica K','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(31,31,'swetha Reji','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(32,32,'kishore','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(33,33,'Alen sabu','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(34,34,'Simil Benny','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(35,35,'Jeswin Shaju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(36,36,'parvathy poulouse','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(37,37,'ann mariya devassy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(38,38,'MARIYA','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(39,39,'Parvathy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(40,40,'Alex babu','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(41,41,'jisiya','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(42,42,'Athul roy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(43,43,'festin francis','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(44,44,'Arjun Saji','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(45,45,'amal eldhose','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(46,46,'sujay anil','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(47,47,'antonio','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(48,48,'shahin','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(49,49,'Adarsh','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(50,50,'nash A o','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(51,51,'reebish santhosh','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(52,52,'Aparna Alias','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(53,53,'nibin john','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(54,54,'Nakul gopinath','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(55,55,'Eldho George','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(56,56,'josiya','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(57,57,'Neena Mathew','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(58,58,'Dhiya Rose','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(59,59,'Sherine Shaju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(60,60,'Renjith T.A','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(61,61,'charles george','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(62,62,'john peter','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(63,63,'Akash','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(64,64,'silpa','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(65,65,'Maria Rose Joy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(66,66,'Sujil Mathew','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(67,67,'Sanju Sabu','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(68,68,'Jerin Joy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(69,69,'Dini K Davis','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(70,70,'Emmanuel Xavier','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(71,71,'Anette Joy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(72,72,'Christal Biju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(73,73,'Tom Sebastian','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(74,74,'Athul Pramond','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(75,75,'Mohammed Shanif','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(76,76,'Alen Mathew Paul','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(77,77,'Anjana Suku','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(78,78,'Devika PV','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(79,79,'Ananthu MK','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(80,80,'Mebin Benny','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(81,81,'JEZEBEL MERLIN','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(82,82,'grace helen','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(83,83,'dinu denny','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(84,84,'mariya sony','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(85,85,'Aleena biju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(86,86,'Benjammin Benny','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(87,87,'prince cleetus','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(88,88,'Heaven christo','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(89,89,'Leads - JULY','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(90,90,'Darsana C.S','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(91,91,'Andriya Baby','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(92,92,'Denil K Thoman','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(93,93,'Ananya Shijo','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(94,94,'John Saju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(95,95,'Gaius Rajan','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(96,96,'Wilston P Wilson','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(97,97,'Niya Tomy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(98,98,'Sial P Raju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(99,99,'Sanoop Babu','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(100,100,'Jerin Joy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(101,101,'Leads - AUGUST','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(102,102,'AKHIL BIJU','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(103,103,'JOYAL SYJAN','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(104,104,'BONY RARICHAN','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(105,105,'GIFTY TOMY','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(106,106,'GHOSHMON M G','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(107,107,'ANIL K A','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(108,108,'ANILA JOHNSON','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(109,109,'ASWIN POTTEPARAMBIL','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(110,110,'YESHWIN SABU','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(111,111,'RENJITH','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(112,112,'GIFTY V D FOR PTE COACHING','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(113,113,'MERIN ROSE','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(114,114,'GODWIN T PAULSON','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(115,115,'SELBIN JOHN','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(116,116,'Leads - September','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(117,117,'Dhanya Louis','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(118,118,'Aswin Shaji','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(119,119,'Rose Mary Benny','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(120,120,'Sneha Mary Varghese','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(121,121,'Libin Joseph','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(122,122,'Abhiesk A','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(123,123,'Kavya Murali','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(124,124,'Tinu Yohannan','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(125,125,'Namrutha P','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(126,126,'Mary Anjana Antony','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(127,127,'Akshay Rajendran','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(128,128,'Dibin Biju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(129,129,'Denil Joy','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(130,130,'Aparna V','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(131,131,'Melissa Jaiby','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(132,132,'Balamuralikrishna','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(133,133,'Nandana Surendran','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(134,134,'Albin Reji','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(135,135,'Abhijith Siju','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(136,136,'Anas','2026-10-21','2026-10-21 10:03:06',1,'Admin User',34,'Roshini',26,'PENDING',11,'Angamaly',16,'Management','new'),(153,1,'Anil Paul','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(154,2,'Christy Thomas','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(155,3,'Mereena Sebastian','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(156,4,'ARYA UNNI','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(157,5,'Anju Shaibu','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(158,6,'Mathews P cheriyan','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(159,7,'Melvin Michael','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(160,8,'Stefin father','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(161,9,'Alisha Jose','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(162,10,'Dona Mary Davis','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(163,11,'Anna K Thomas','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(164,12,'Albin Nixon','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(165,13,'Amal Krishna Pradeep','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(166,14,'Christo','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(167,15,'Anto','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(168,16,'Akhila','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(169,17,'Jelin','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(170,18,'Jithin Kunjumon','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(171,19,'Albin Mathew','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(172,20,'Avitha','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(173,21,'Nithul Biju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(174,22,'Jomel P Sasi','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(175,23,'Midhu','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(176,24,'bibin baby','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(177,25,'Nithin','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(178,26,'Aldrin Wilson','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(179,27,'pournamy v s','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(180,28,'JITHIN','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(181,29,'ALAN M V','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(182,30,'Veronica K','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(183,31,'swetha Reji','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(184,32,'kishore','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(185,33,'Alen sabu','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(186,34,'Simil Benny','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(187,35,'Jeswin Shaju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(188,36,'parvathy poulouse','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(189,37,'ann mariya devassy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(190,38,'MARIYA','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(191,39,'Parvathy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(192,40,'Alex babu','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(193,41,'jisiya','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(194,42,'Athul roy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(195,43,'festin francis','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(196,44,'Arjun Saji','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(197,45,'amal eldhose','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(198,46,'sujay anil','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(199,47,'antonio','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(200,48,'shahin','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(201,49,'Adarsh','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(202,50,'nash A o','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(203,51,'reebish santhosh','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(204,52,'Aparna Alias','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(205,53,'nibin john','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(206,54,'Nakul gopinath','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(207,55,'Eldho George','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(208,56,'josiya','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(209,57,'Neena Mathew','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(210,58,'Dhiya Rose','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(211,59,'Sherine Shaju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(212,60,'Renjith T.A','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(213,61,'charles george','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(214,62,'john peter','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(215,63,'Akash','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(216,64,'silpa','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(217,65,'Maria Rose Joy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(218,66,'Sujil Mathew','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(219,67,'Sanju Sabu','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(220,68,'Jerin Joy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(221,69,'Dini K Davis','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(222,70,'Emmanuel Xavier','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(223,71,'Anette Joy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(224,72,'Christal Biju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(225,73,'Tom Sebastian','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(226,74,'Athul Pramond','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(227,75,'Mohammed Shanif','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(228,76,'Alen Mathew Paul','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(229,77,'Anjana Suku','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(230,78,'Devika PV','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(231,79,'Ananthu MK','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(232,80,'Mebin Benny','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(233,81,'JEZEBEL MERLIN','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(234,82,'grace helen','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(235,83,'dinu denny','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(236,84,'mariya sony','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(237,85,'Aleena biju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(238,86,'Benjammin Benny','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(239,87,'prince cleetus','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(240,88,'Heaven christo','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(241,89,'Leads - JULY','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(242,90,'Darsana C.S','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(243,91,'Andriya Baby','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(244,92,'Denil K Thoman','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(245,93,'Ananya Shijo','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(246,94,'John Saju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(247,95,'Gaius Rajan','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(248,96,'Wilston P Wilson','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(249,97,'Niya Tomy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(250,98,'Sial P Raju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(251,99,'Sanoop Babu','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(252,100,'Jerin Joy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(253,101,'Leads - AUGUST','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(254,102,'AKHIL BIJU','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(255,103,'JOYAL SYJAN','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(256,104,'BONY RARICHAN','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(257,105,'GIFTY TOMY','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(258,106,'GHOSHMON M G','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(259,107,'ANIL K A','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(260,108,'ANILA JOHNSON','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(261,109,'ASWIN POTTEPARAMBIL','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(262,110,'YESHWIN SABU','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(263,111,'RENJITH','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(264,112,'GIFTY V D FOR PTE COACHING','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(265,113,'MERIN ROSE','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(266,114,'GODWIN T PAULSON','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(267,115,'SELBIN JOHN','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(268,116,'Leads - September','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(269,117,'Dhanya Louis','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(270,118,'Aswin Shaji','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(271,119,'Rose Mary Benny','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(272,120,'Sneha Mary Varghese','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(273,121,'Libin Joseph','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(274,122,'Abhiesk A','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(275,123,'Kavya Murali','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(276,124,'Tinu Yohannan','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(277,125,'Namrutha P','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(278,126,'Mary Anjana Antony','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(279,127,'Akshay Rajendran','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(280,128,'Dibin Biju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(281,129,'Denil Joy','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(282,130,'Aparna V','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(283,131,'Melissa Jaiby','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(284,132,'Balamuralikrishna','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(285,133,'Nandana Surendran','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(286,134,'Albin Reji','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(287,135,'Abhijith Siju','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(288,136,'Anas','2026-10-29','2026-10-29 15:17:47',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','New Leads'),(290,136,'Anas','2026-10-29','2026-10-29 16:59:19',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','test\n'),(291,136,'Anas','2026-10-29','2026-10-29 16:59:31',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing','g'),(292,136,'Anas','2026-10-29','2026-10-29 16:59:54',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing',''),(293,136,'Anas','2026-10-29','2026-10-29 17:09:59',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing',''),(294,136,'Anas','2026-10-30','2026-10-30 11:02:58',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing',''),(295,136,'Anas','2026-10-31','2026-10-30 11:03:08',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing',''),(296,136,'Anas','2026-10-30','2026-10-30 11:03:34',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing',''),(297,136,'Anas',NULL,'2026-10-30 11:03:59',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing',''),(298,136,'Anas','2026-10-30','2026-10-30 11:04:07',1,'Admin User',58,'Dhiljith',26,'PENDING',16,'Angamaly',31,'Marketing',''),(299,136,'Anas','2026-10-30','2026-10-30 11:50:57',1,'Admin User',58,'Dhiljith',2,'Positive',16,'Angamaly',31,'Marketing',''),(304,136,'Anas','2026-11-06','2026-10-30 17:09:43',1,'Admin User',58,'Dhiljith',2,'Positive',16,'Angamaly',31,'Marketing',''),(305,136,'Anas','2026-11-06','2026-10-30 17:56:25',1,'Admin User',59,'Akshay',2,'Positive',16,'Angamaly',31,'Marketing','');
/*!40000 ALTER TABLE `follow_ups` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intakes`
--

LOCK TABLES `intakes` WRITE;
/*!40000 ALTER TABLE `intakes` DISABLE KEYS */;
INSERT INTO `intakes` VALUES (2,1,'DURATION',1,'2026-08-21 06:38:28');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_flows`
--

LOCK TABLES `ivr_flows` WRITE;
/*!40000 ALTER TABLE `ivr_flows` DISABLE KEYS */;
INSERT INTO `ivr_flows` VALUES (1,1,'Main IVR','+911234599999',NULL,'[{\"key\": \"1\", \"label\": \"Sales\", \"value\": \"+911234567890\", \"action\": \"forward\"}, {\"key\": \"2\", \"label\": \"Support\", \"value\": \"1\", \"action\": \"chatbot\"}, {\"key\": \"3\", \"label\": \"Business Hours\", \"value\": \"Our business hours are 9 AM to 6 PM, Monday to Saturday.\", \"action\": \"play\"}]',NULL,1,'2026-04-29 08:59:39');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_emails`
--

LOCK TABLES `lead_emails` WRITE;
/*!40000 ALTER TABLE `lead_emails` DISABLE KEYS */;
INSERT INTO `lead_emails` VALUES (2,1,315,'TEST-1792132843973','202610160640.99011497475@smtp-relay.mailin.fr','worksufs@gmail.com','nandanbabu2003@gmail.com','Trackbox CRM Bulk Email Test (1792132842885)','<p>Hello <strong>Babu</strong>,</p><p>This is a diagnostic test email dispatched from Trackbox CRM to verify end-to-end delivery.</p><p>Best regards,<br/>Trackbox Team</p>','queued',NULL,'2026-10-16 06:40:43','2026-10-16 06:40:43',NULL,NULL,NULL,NULL,NULL),(3,1,316,'CAMP-1792133649453','202610160654.97861817400@smtp-relay.mailin.fr','worksufs@gmail.com','rijusabu89@gmail.com','welcome_offer','Hi {{1}}! Welcome to UrbanChat. Enjoy 20% off your first order with code URBAN20. Shop now!','queued',NULL,'2026-10-16 06:54:10','2026-10-16 06:54:10',NULL,NULL,NULL,NULL,NULL),(4,1,314,'CAMP-1792133649453','202610160654.39071393012@smtp-relay.mailin.fr','worksufs@gmail.com','nandanbabu2003@gmail.com','welcome_offer','Hi {{1}}! Welcome to UrbanChat. Enjoy 20% off your first order with code URBAN20. Shop now!','queued',NULL,'2026-10-16 06:54:10','2026-10-16 06:54:10',NULL,NULL,NULL,NULL,NULL),(5,1,314,'CAMP-1792134047157','202610160700.99651581703@smtp-relay.mailin.fr','worksufs@gmail.com','nandanbabu2003@gmail.com','Nandan, let\'s discuss your next career step!','Hi Nandan,\n\nWe are excited to connect with you!\n\nWhether you\'re looking to upskill, explore new certifications, or kickstart your career with our hands-on industry programs, our team is here to support you at every milestone.\n\nWe invite you to schedule a free 1-on-1 counseling session with one of our academic mentors this week to map out the best path forward for your goals.\n\nIf you\'re interested, simply reply to this email with \"YES\" or share your preferred call time.\n\nBest regards,\nStudent Admissions & Relations\nTrackbox CRM Team','queued',NULL,'2026-10-16 07:00:48','2026-10-16 07:00:48',NULL,NULL,NULL,NULL,NULL),(6,1,139,'CAMP-1793184077873','202610281041.38844963602@smtp-relay.mailin.fr','worksufs@gmail.com','alby97614@gmail.com','alby, let\'s discuss your next career step!','Hi alby,\n\nWe are excited to connect with you!\n\nWhether you\'re looking to upskill, explore new certifications, or kickstart your career with our hands-on industry programs, our team is here to support you at every milestone.\n\nWe invite you to schedule a free 1-on-1 counseling session with one of our academic mentors this week to map out the best path forward for your goals.\n\nIf you\'re interested, simply reply to this email with \"YES\" or share your preferred call time.\n\nBest regards,\nStudent Admissions & Relations\nTrackbox CRM Team','queued',NULL,'2026-10-28 10:41:19','2026-10-28 10:41:19',NULL,NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_fields`
--

LOCK TABLES `lead_fields` WRITE;
/*!40000 ALTER TABLE `lead_fields` DISABLE KEYS */;
INSERT INTO `lead_fields` VALUES (8,1,'Course','course','dropdown','[\"mca\", \"mcom\"]',0,0,'2026-09-09 12:28:35',3),(9,1,'Hobbies','hobbies','text',NULL,0,0,'2026-09-18 10:40:44',4),(10,1,'Passport Number','passport_number','text',NULL,0,0,'2026-09-18 10:40:44',5),(11,1,'Age','age','number',NULL,0,0,'2026-09-18 10:40:44',5),(14,1,'Tutor','tutor','dropdown','[\"Sneha\"]',0,6,'2026-10-06 07:42:19',8);
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
) ENGINE=InnoDB AUTO_INCREMENT=186 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (21,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: sdfjkl',22,1,'2026-07-28 11:54:02'),(22,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: lkjhgf',24,1,'2026-07-28 11:56:33'),(23,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: test',26,1,'2026-07-28 11:57:27'),(24,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: ggy',27,1,'2026-07-28 11:58:12'),(25,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: jaya',28,1,'2026-07-28 12:03:00'),(26,1,14,'assignment','Contact Reassigned','A contact has been assigned to you: b',47,0,'2026-07-31 16:01:47'),(27,1,18,'assignment','Contact Reassigned','A contact has been assigned to you: d',40,0,'2026-07-31 16:01:58'),(28,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: c',48,0,'2026-07-31 17:05:13'),(29,1,19,'assignment','New Contact Assigned','You have been assigned a new contact: testtt',51,0,'2026-07-31 17:11:45'),(30,1,18,'assignment','Contact Reassigned','A contact has been assigned to you: s',45,0,'2026-07-31 17:17:11'),(31,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: testtt',51,0,'2026-07-31 17:26:56'),(32,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: c',48,0,'2026-08-03 05:54:49'),(33,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: d',43,0,'2026-08-03 06:05:41'),(34,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: d',43,0,'2026-08-03 06:07:18'),(35,1,20,'assignment','New Contact Assigned','You have been assigned a new contact: test333',52,0,'2026-08-03 06:21:26'),(36,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: d',46,0,'2026-08-03 06:22:22'),(37,1,18,'assignment','Contact Reassigned','A contact has been assigned to you: Nandan Babu',25,0,'2026-08-03 06:28:19'),(38,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: r',42,0,'2026-08-15 10:08:08'),(39,1,20,'assignment','Contact Reassigned','A contact has been assigned to you: b',47,0,'2026-08-17 08:29:58'),(40,1,20,'assignment','New Contact Assigned','You have been assigned a new contact: kavatta thala',53,0,'2026-08-18 04:47:49'),(41,1,20,'assignment','Contact Reassigned','A contact has been assigned to you: kavatta thalay',53,0,'2026-08-19 05:05:18'),(42,1,21,'assignment','New Contact Assigned','You have been assigned a new contact: rohit',54,0,'2026-08-21 04:39:53'),(43,1,19,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',55,0,'2026-08-21 04:47:49'),(54,1,23,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-21 08:14:46'),(55,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,1,'2026-08-21 08:15:00'),(57,1,24,'assignment','Contact Reassigned','A contact has been assigned to you: AMITH  ',7,0,'2026-08-21 08:21:23'),(58,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-21 16:11:43'),(59,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-22 04:30:22'),(60,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',8,0,'2026-08-24 05:52:51'),(62,1,23,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-24 06:15:29'),(63,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 06:21:48'),(64,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 06:22:13'),(65,1,27,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 08:18:19'),(66,1,27,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 09:33:05'),(67,1,24,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 10:00:10'),(68,1,24,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 10:00:56'),(69,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 10:11:44'),(70,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 10:11:50'),(71,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-24 11:34:35'),(72,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 11:34:53'),(73,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 11:35:04'),(74,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-24 11:35:15'),(75,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: JAYASREE',8,0,'2026-08-24 11:42:14'),(76,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-24 11:42:27'),(77,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-24 11:42:37'),(78,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 11:42:46'),(79,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 11:42:57'),(80,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: ADHIL ',1,0,'2026-08-24 11:44:05'),(81,1,29,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-24 11:51:17'),(82,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',11,0,'2026-08-24 11:58:25'),(83,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',9,0,'2026-08-24 11:58:25'),(84,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',10,0,'2026-08-24 11:58:25'),(85,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE babu',12,0,'2026-08-24 11:58:25'),(86,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',13,0,'2026-08-24 11:58:25'),(87,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',14,0,'2026-08-24 11:58:51'),(88,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: Nandan Babu',14,0,'2026-08-24 12:25:48'),(89,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: ajay',15,0,'2026-08-24 12:31:10'),(90,1,30,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',16,0,'2026-08-24 12:36:45'),(91,1,23,'assignment','Contact Reassigned','A contact has been assigned to you: JAYASREE',16,0,'2026-08-24 12:37:01'),(92,1,25,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',17,0,'2026-08-24 12:43:39'),(93,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: shalu',17,0,'2026-08-24 12:44:15'),(94,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: shalu',17,0,'2026-08-24 12:46:06'),(106,5,28,'assignment','New Contact Assigned','You have been assigned a new contact: Investigation Test Lead',23,0,'2026-08-27 06:12:14'),(107,5,28,'assignment','New Contact Assigned','You have been assigned a new contact: Investigation Test Lead',24,0,'2026-08-27 06:19:23'),(108,5,28,'assignment','New Contact Assigned','You have been assigned a new contact: Investigation Test Lead',25,0,'2026-08-27 06:25:26'),(125,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: nayan',29,0,'2026-09-10 06:09:34'),(128,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: jasmin',28,0,'2026-09-11 10:11:12'),(129,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 11:45:08'),(130,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',33,0,'2026-09-18 11:45:25'),(131,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: nayan',29,0,'2026-09-18 12:00:17'),(136,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 12:40:35'),(137,1,32,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 12:41:28'),(138,1,32,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 12:41:48'),(139,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-10-06 07:18:55'),(140,1,33,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-10-06 07:25:03'),(141,1,33,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-10-06 07:25:59'),(142,1,33,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-10-06 07:32:25'),(143,1,33,'assignment','New Contact Assigned','You have been assigned a new contact: albin',36,0,'2026-10-06 08:17:44'),(144,1,33,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',313,0,'2026-10-06 10:30:52'),(145,1,31,'assignment','New Contact Assigned','You have been assigned a new contact: Babu',315,0,'2026-10-15 10:57:13'),(146,1,32,'assignment','New Contact Assigned','You have been assigned a new contact: RIJU',316,0,'2026-10-16 06:52:42'),(152,1,31,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',317,0,'2026-10-16 11:38:57'),(153,1,33,'assignment','Contact Reassigned','A contact has been assigned to you: Nandana Surendran',310,0,'2026-10-20 05:57:05'),(154,1,34,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',137,0,'2026-10-21 04:34:03'),(155,1,34,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-21 04:35:08'),(156,1,34,'assignment','Contact Reassigned','A contact has been assigned to you: Abhijith Siju',135,0,'2026-10-21 04:35:13'),(157,1,34,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-21 04:40:09'),(158,1,34,'assignment','Contact Reassigned','A contact has been assigned to you: Abhijith Siju',135,0,'2026-10-21 04:40:17'),(159,1,34,'assignment','Contact Reassigned','A contact has been assigned to you: Nandan Babu',137,0,'2026-10-21 05:57:51'),(160,1,34,'assignment','Contact Reassigned','A contact has been assigned to you: Nandan Babu',137,0,'2026-10-21 06:06:48'),(161,1,34,'assignment','Contact Reassigned','A contact has been assigned to you: Nandan Babu',137,0,'2026-10-21 09:47:21'),(164,1,49,'assignment','Contact Reassigned','A contact has been assigned to you: alby',139,0,'2026-10-28 10:41:11'),(165,1,49,'assignment','Contact Reassigned','A contact has been assigned to you: alby',139,0,'2026-10-28 11:23:06'),(166,1,49,'assignment','Contact Reassigned','A contact has been assigned to you: salmam',138,0,'2026-10-28 11:23:56'),(167,1,49,'assignment','Contact Reassigned','A contact has been assigned to you: salmam',138,0,'2026-10-28 12:35:22'),(168,1,49,'assignment','Contact Reassigned','A contact has been assigned to you: salmam',138,0,'2026-10-29 04:23:01'),(169,1,51,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',143,0,'2026-10-29 08:44:43'),(170,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-29 11:29:19'),(171,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-29 11:29:31'),(172,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-29 11:29:54'),(173,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-29 11:39:59'),(174,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 05:32:59'),(175,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 05:33:08'),(176,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 05:33:34'),(177,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 05:33:59'),(178,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 05:34:07'),(179,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 06:20:57'),(180,1,62,'assignment','Contact Reassigned','A contact has been assigned to you: Kalady Student Test',137,0,'2026-10-30 06:58:21'),(181,1,62,'assignment','Contact Reassigned','A contact has been assigned to you: Kalady Student Test',137,0,'2026-10-30 07:41:37'),(182,1,62,'assignment','Contact Reassigned','A contact has been assigned to you: Kalady Student Test',137,0,'2026-10-30 10:58:19'),(183,1,62,'assignment','Contact Reassigned','A contact has been assigned to you: Kalady Student Test',137,0,'2026-10-30 11:10:33'),(184,1,58,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 11:39:43'),(185,1,59,'assignment','Contact Reassigned','A contact has been assigned to you: Anas',136,0,'2026-10-30 12:26:25');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcs_templates`
--

LOCK TABLES `rcs_templates` WRITE;
/*!40000 ALTER TABLE `rcs_templates` DISABLE KEYS */;
INSERT INTO `rcs_templates` VALUES (1,1,'Product Showcase Card','rich_card','{\"title\": \"Check Our Latest Offers!\", \"buttons\": [{\"type\": \"openUrl\", \"label\": \"Shop Now\", \"value\": \"https://urbanchat.in\"}], \"imageUrl\": \"\", \"description\": \"Exclusive deals just for you.\"}','2026-04-29 08:59:39');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_types`
--

LOCK TABLES `receipt_types` WRITE;
/*!40000 ALTER TABLE `receipt_types` DISABLE KEYS */;
INSERT INTO `receipt_types` VALUES (1,1,'Application Fees','2026-10-21 05:39:51'),(2,1,'Registration Fees','2026-10-21 05:55:46');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
INSERT INTO `receipts` VALUES (9,136,1,1,'Application Fees',15000.00,'2026-10-30','online payment ',1,'Admin User','2026-10-30 06:20:21');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_dlt_templates`
--

LOCK TABLES `sms_dlt_templates` WRITE;
/*!40000 ALTER TABLE `sms_dlt_templates` DISABLE KEYS */;
INSERT INTO `sms_dlt_templates` VALUES (1,1,'DLT123456','OTP Template','Your OTP is {#var#}. Valid for 10 minutes. - UrbanChat','otp','approved','2026-04-29 08:59:39');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (1,'Not interested','Yes','#9E0E14',1,'2026-10-21 04:38:39','2026-10-21 04:39:59',0,NULL,'sale_lost'),(2,'Positive','Yes','#1B7340',2,'2026-10-21 04:38:39','2026-10-21 04:39:15',1,NULL,'sale'),(3,'Not responding','Yes','#D8B4FE',3,'2026-10-21 04:38:39','2026-10-21 04:38:39',0,NULL,NULL),(4,'Registered','No','#0D62A6',4,'2026-10-21 04:38:39','2026-10-21 04:38:39',0,NULL,NULL),(5,'Duplicate','No','#9E0E14',5,'2026-10-21 04:38:39','2026-10-21 04:38:39',0,NULL,NULL),(6,'Rejected','Yes','#8E0C10',6,'2026-10-21 04:38:39','2026-10-21 04:39:27',1,NULL,'sale_lost'),(7,'Incoming cut/ Invalid no','No','#9E0E14',7,'2026-10-21 04:38:39','2026-10-21 04:38:39',0,NULL,NULL),(8,'Follow up','Yes','#FDE68A',8,'2026-10-21 04:38:39','2026-10-21 04:38:39',0,NULL,NULL),(9,'Future positive','Yes','#4A2E78',9,'2026-10-21 04:38:39','2026-10-21 04:39:42',1,NULL,'sale'),(26,'PENDING','Yes','#6366f1',0,'2026-10-28 09:42:38','2026-10-29 09:22:34',1,28,'pending');
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
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
INSERT INTO `team_members` VALUES (104,24,53,'2026-10-29 09:57:31'),(105,24,54,'2026-10-29 09:57:31'),(106,24,55,'2026-10-29 09:57:31'),(121,27,61,'2026-10-30 05:56:34'),(122,27,62,'2026-10-30 05:56:34'),(123,27,63,'2026-10-30 05:56:34'),(124,27,64,'2026-10-30 05:56:34'),(125,27,65,'2026-10-30 05:56:34'),(126,28,52,'2026-10-30 06:17:04'),(127,28,53,'2026-10-30 06:17:04'),(128,28,54,'2026-10-30 06:17:04'),(129,28,55,'2026-10-30 06:17:04'),(130,28,56,'2026-10-30 06:17:04'),(131,28,57,'2026-10-30 06:17:04'),(132,28,58,'2026-10-30 06:17:04'),(133,28,59,'2026-10-30 06:17:04'),(134,28,60,'2026-10-30 06:17:04');
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
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,1,'__agent_18',NULL,'2026-07-25 05:06:35'),(5,1,'__agent_20',NULL,'2026-08-03 06:01:10'),(6,1,'__agent_19',NULL,'2026-08-04 05:01:17'),(7,1,'__agent_17',NULL,'2026-08-19 04:08:52'),(8,1,'__agent_21',NULL,'2026-08-19 04:09:33'),(12,1,'__agent_26',NULL,'2026-08-21 16:11:12'),(15,1,'__agent_35',NULL,'2026-10-29 08:11:03'),(16,1,'__agent_51',NULL,'2026-10-29 08:42:48'),(24,1,'__agent_53',NULL,'2026-10-29 09:57:31'),(27,1,'__agent_61',NULL,'2026-10-30 05:56:34'),(28,1,'__agent_52',NULL,'2026-10-30 06:17:04');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES (3,1,'{{first_name}}, let\'s discuss your next career step!','MARKETING','en','none',NULL,'Hi {{first_name}},\n\nWe are excited to connect with you!\n\nWhether you\'re looking to upskill, explore new certifications, or kickstart your career with our hands-on industry programs, our team is here to support you at every milestone.\n\nWe invite you to schedule a free 1-on-1 counseling session with one of our academic mentors this week to map out the best path forward for your goals.\n\nIf you\'re interested, simply reply to this email with \"YES\" or share your preferred call time.\n\nBest regards,\nStudent Admissions & Relations\nTrackbox CRM Team','Trackbox CRM',NULL,'approved',NULL,'2026-10-16 06:56:28');
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
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'New Zealand',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `universities`
--

LOCK TABLES `universities` WRITE;
/*!40000 ALTER TABLE `universities` DISABLE KEYS */;
INSERT INTO `universities` VALUES (1,'University of Auckland','New Zealand','Auckland','https://www.auckland.ac.nz','Top-ranked university in New Zealand offering diverse degrees.','2026-10-30 10:31:59','2026-10-30 10:31:59'),(2,'University of Otago','New Zealand','Dunedin','https://www.otago.ac.nz','Oldest university in New Zealand known for health sciences and research.','2026-10-30 10:31:59','2026-10-30 10:31:59'),(3,'Victoria University of Wellington','New Zealand','Wellington','https://www.wgtn.ac.nz','Located in the capital city, renowned for law, humanities, and science.','2026-10-30 10:31:59','2026-10-30 10:31:59'),(4,'University of Canterbury','New Zealand','Christchurch','https://www.canterbury.ac.nz','Prestigious institution known for engineering and science programs.','2026-10-30 10:31:59','2026-10-30 10:31:59'),(5,'Massey University','New Zealand','Palmerston North','https://www.massey.ac.nz','Innovative university leading in business, creative arts, and aviation.','2026-10-30 10:31:59','2026-10-30 10:31:59'),(6,'University of Waikato','New Zealand','Hamilton','https://www.waikato.ac.nz','Internationally recognized for computer science, business, and education.','2026-10-30 10:31:59','2026-10-30 10:31:59'),(7,'Lincoln University','New Zealand','Lincoln, Canterbury','https://www.lincoln.ac.nz','Specialist university focused on agriculture, environment, and commerce.','2026-10-30 10:31:59','2026-10-30 10:31:59'),(8,'Auckland University of Technology (AUT)','New Zealand','Auckland','https://www.aut.ac.nz','Contemporary university focusing on technology, design, and practical skills.','2026-10-30 10:31:59','2026-10-30 10:31:59');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `business_id` (`business_id`),
  KEY `fk_users_branch` (`branch_id`),
  KEY `fk_users_department` (`department_id`),
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,NULL,NULL,'Admin User','admin','$2b$10$0ZxQN0dfmJL2E73gWlgT.u2bT2Bo9CI4WcZQmHW3hvlI5e70JP7au','admin',1,'2026-04-29 08:59:39',NULL,'active',22,'1','2023-01-06','[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Inbox\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Broadcasts\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Chatbots\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Templates\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Users / Agents\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"HR\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Leave Request\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true}]','[8, 5, 3, 4]',0),(50,1,NULL,NULL,'UFS','ufs','$2b$10$tFXLYR9X//uqe/6j1HoTSuNGqROLSgzGhfkiUlsLv8A9/Y/5jMBC6','admin',1,'2026-10-22 11:09:40','ufs','active',NULL,NULL,NULL,'[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Inbox\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Broadcasts\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Chatbots\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Templates\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Users / Agents\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"HR\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Leave Request\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true}]','[8, 5, 3, 4]',1),(52,1,16,39,'Roshini','roshini@yourcompany.com','$2b$10$/.8zoByWJFpjeug7mTkAX.oQ5ew9NSJZ0fXUELfDy7HrhdWtoSsgO','manager',1,'2026-10-29 09:42:46','roshini','active',NULL,NULL,NULL,'[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Inbox\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Broadcasts\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Chatbots\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Templates\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Users / Agents\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"HR\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Leave Request\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true}]','[]',0),(53,1,16,29,'Shalna','shalna@yourcompany.com','$2b$10$q7GWgrcvTjyZoUDKtnyr8O7oPH3EYBflozc4l90H0z.12YFd4T70a','agent',1,'2026-10-29 09:42:46','shalna','active',NULL,NULL,NULL,'[{\"menuName\":\"Dashboard\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Inbox\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Broadcasts\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Chatbots\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Templates\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Teams\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Branch\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Department\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Designation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Intake\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Year\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Application Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Enquiry For\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Document Type\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channel\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channels Manager\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Users / Agents\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Fields\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Field Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Source Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"API & Webhooks\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Integrations\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Courses\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"HR\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Leave Request\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false}]','[]',0),(54,1,16,29,'Irin','irin@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','irin','active',NULL,NULL,NULL,NULL,NULL,0),(55,1,16,29,'Roshan','roshan@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','roshan','active',NULL,NULL,NULL,NULL,NULL,0),(56,1,16,30,'Bessy','bessy@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','bessy','active',NULL,NULL,NULL,'[{\"menuName\":\"Dashboard\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Inbox\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Broadcasts\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Chatbots\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Templates\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Reports\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Settings\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Teams\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Branch\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Department\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Designation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Intake\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Year\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Application Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Enquiry For\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Document Type\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channel\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channels Manager\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Users / Agents\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Fields\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Field Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Source Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"API & Webhooks\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Integrations\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Courses\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"CRM\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Operation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"HR\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Leave Request\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false}]',NULL,0),(57,1,16,30,'Aswathi','aswathi@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','aswathi','active',NULL,NULL,NULL,NULL,NULL,0),(58,1,16,31,'Dhiljith','dhiljith@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','dhiljith','active',NULL,NULL,NULL,NULL,NULL,0),(59,1,16,31,'Akshay','akshay@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','akshay','active',NULL,NULL,NULL,NULL,NULL,0),(60,1,16,32,'Limna','limna@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','limna','active',NULL,NULL,NULL,NULL,NULL,0),(61,1,17,40,'Tinu Paul','tinu@yourcompany.com','$2b$10$ndqIMCgqItOnZqot6ZDFquj7MoCfMw7jjF4H.r6z3N5g3DMpXFFAG','manager',1,'2026-10-29 09:42:46','tinupaul','active',NULL,NULL,NULL,'[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Inbox\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Broadcasts\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Chatbots\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Templates\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Users / Agents\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"HR\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Leave Request\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true}]','[]',0),(62,1,17,38,'Josmy','josmy@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','josmy','active',NULL,NULL,NULL,NULL,NULL,0),(63,1,17,36,'Sandra','sandra@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','sandra','active',NULL,NULL,NULL,NULL,NULL,0),(64,1,17,36,'Sreelakshmi Saji','sreelakshmi.saji@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','sreelakshmisaji','active',NULL,NULL,NULL,'[{\"menuName\":\"Dashboard\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Inbox\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Broadcasts\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Chatbots\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Templates\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Reports\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Settings\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Teams\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Branch\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Department\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Designation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Intake\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Year\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Application Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Enquiry For\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Document Type\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channel\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channels Manager\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Users / Agents\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Fields\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Field Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Source Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"API & Webhooks\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Integrations\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Courses\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"CRM\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Operation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"HR\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Leave Request\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false}]',NULL,0),(65,1,17,37,'Sreelakshmi Mani','sreelakshmi.mani@yourcompany.com','PASTE_BCRYPT_HASH_HERE','agent',1,'2026-10-29 09:42:46','sreelakshmimani','active',NULL,NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
  `status` enum('Submitted','Approved') NOT NULL,
  `details` text,
  `visa_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `visa_id` (`visa_id`),
  KEY `contact_id` (`contact_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `visa_history_ibfk_1` FOREIGN KEY (`visa_id`) REFERENCES `visas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_history_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_history_ibfk_3` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_history`
--

LOCK TABLES `visa_history` WRITE;
/*!40000 ALTER TABLE `visa_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `visa_history` ENABLE KEYS */;
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
  `business_id` int NOT NULL,
  `status` enum('Submitted','Approved') NOT NULL DEFAULT 'Submitted',
  `visa_date` date DEFAULT NULL,
  `description` text,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `visas_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visas_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visas_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visas`
--

LOCK TABLES `visas` WRITE;
/*!40000 ALTER TABLE `visas` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_widgets`
--

LOCK TABLES `website_widgets` WRITE;
/*!40000 ALTER TABLE `website_widgets` DISABLE KEYS */;
INSERT INTO `website_widgets` VALUES (1,1,1,'UrbanChat Support','Hi! How can we help you today?','#6C5CE7','bottom-right',NULL,'debdfa7407682141d0e51541e978bdcd',1,'2026-04-30 04:23:17');
/*!40000 ALTER TABLE `website_widgets` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `years`
--

LOCK TABLES `years` WRITE;
/*!40000 ALTER TABLE `years` DISABLE KEYS */;
INSERT INTO `years` VALUES (2,'2026',1);
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

-- Dump completed on 2026-10-31  9:47:43
