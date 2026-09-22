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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_history`
--

LOCK TABLES `application_history` WRITE;
/*!40000 ALTER TABLE `application_history` DISABLE KEYS */;
INSERT INTO `application_history` VALUES (9,7,NULL,'Application Created','Initial application created.','2026-08-31 04:19:27'),(10,7,NULL,'Application Updated','Status changed from \'PENDING \' to \'approved\'','2026-08-31 12:36:53'),(11,8,NULL,'Application Created','Initial application created.','2026-08-31 12:38:27'),(12,9,NULL,'Application Created','Initial application created.','2026-08-31 12:39:09'),(13,10,NULL,'Application Created','Initial application created.','2026-08-31 13:14:03'),(14,10,NULL,'Application Updated','Status changed from \'approved\' to \'PENDING \'','2026-08-31 13:14:46');
/*!40000 ALTER TABLE `application_history` ENABLE KEYS */;
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
INSERT INTO `application_statuses` VALUES (1,1,'approved','#10B981',1,'2026-07-14 06:09:19'),(3,1,'PENDING ','#fb3909',1,'2026-08-21 06:38:53');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (7,1,'uk','kerala','bca',2,2,1,'check',NULL,'2026-08-31 04:19:27','2026-08-31 12:36:53',29),(8,1,'Germany','kerala unversity','mca',2,2,3,'check',NULL,'2026-08-31 12:38:27','2026-08-31 12:38:27',28),(9,1,'Canada','oxford unversity','bcom',2,2,1,'',NULL,'2026-08-31 12:39:09','2026-08-31 12:39:09',27),(10,1,'India','mg unversity','msw',2,2,3,'',NULL,'2026-08-31 13:14:03','2026-08-31 13:14:46',31);
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
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_logs`
--

LOCK TABLES `attendance_logs` WRITE;
/*!40000 ALTER TABLE `attendance_logs` DISABLE KEYS */;
INSERT INTO `attendance_logs` VALUES (5,1,1,'Admin User','lead','2026-07-11 03:50:00','2026-07-13 07:00:08',28,1,'late lead','Completed','2026-07-11 03:50:00'),(6,1,1,'Admin User','crm','2026-07-13 06:31:39','2026-07-13 07:00:12',28,1,'hugiuughi','Completed','2026-07-13 06:31:39'),(7,1,1,'Admin User','operation','2026-07-13 06:31:59','2026-07-13 07:00:16',28,0,NULL,'Completed','2026-07-13 06:31:59'),(40,1,1,'Admin User','lead','2026-07-13 03:30:00','2026-07-13 04:15:00',45,0,NULL,'Completed','2026-07-13 03:30:00'),(41,1,1,'Admin User','crm','2026-07-13 04:30:00','2026-07-13 05:20:00',50,1,'Customer meeting','Completed','2026-07-13 04:30:00'),(42,1,1,'Admin User','operation','2026-07-13 05:30:00','2026-07-13 06:45:00',75,0,NULL,'Completed','2026-07-13 05:30:00'),(43,1,1,'Admin User','hr','2026-07-13 07:30:00','2026-07-13 07:24:16',-6,0,NULL,'Completed','2026-07-13 07:30:00'),(52,3,4,'salman s','lead','2026-07-13 03:30:00','2026-07-13 04:10:00',40,0,NULL,'Completed','2026-07-13 03:30:00'),(53,3,4,'salman s','crm','2026-07-13 04:30:00',NULL,NULL,1,'Client call','Active','2026-07-13 04:30:00'),(54,4,5,'Salman S','lead','2026-07-13 03:50:00','2026-07-13 04:40:00',50,0,NULL,'Completed','2026-07-13 03:50:00'),(55,4,5,'Salman S','operation','2026-07-13 05:00:00',NULL,NULL,0,NULL,'Active','2026-07-13 05:00:00'),(56,1,1,'Admin User','lead','2026-07-14 04:38:01','2026-07-14 04:38:06',0,0,NULL,'Completed','2026-07-14 04:38:01'),(57,1,1,'Admin User','crm','2026-07-31 17:53:46','2026-07-31 17:54:32',0,1,'health issue','Completed','2026-07-31 17:53:46'),(58,1,1,'Admin User','crm','2026-08-03 05:42:16','2026-08-03 06:29:37',47,0,NULL,'Completed','2026-08-03 05:42:16'),(60,1,1,'Admin User','crm','2026-08-03 06:29:42','2026-08-19 07:03:15',23073,0,NULL,'Completed','2026-08-03 06:29:42'),(61,1,1,'Admin User','crm','2026-08-21 08:19:49',NULL,NULL,1,'health issue','Active','2026-08-21 08:19:49'),(62,1,32,'MILAN','crm','2026-08-24 13:15:14',NULL,NULL,1,'traffic','Active','2026-08-24 13:15:14');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (9,'UFS','1','KOCHI','9876543212','2026-08-24 13:11:05','2026-08-24 13:11:05'),(10,'salman','10002','kochi',NULL,'2026-09-10 06:12:37','2026-09-10 06:12:37');
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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channels`
--

LOCK TABLES `channels` WRITE;
/*!40000 ALTER TABLE `channels` DISABLE KEYS */;
INSERT INTO `channels` VALUES (8,3,'whatsapp','2026-07-31 14:41:57','2026-07-31 14:41:57'),(9,3,'sms','2026-07-31 14:41:57','2026-07-31 14:41:57'),(10,3,'rcs','2026-07-31 14:41:57','2026-07-31 14:41:57'),(11,3,'instagram','2026-07-31 14:41:57','2026-07-31 14:41:57'),(12,3,'facebook','2026-07-31 14:41:57','2026-07-31 14:41:57'),(13,3,'website','2026-07-31 14:41:57','2026-07-31 14:41:57'),(14,4,'whatsapp','2026-07-31 14:41:57','2026-07-31 14:41:57'),(15,4,'sms','2026-07-31 14:41:57','2026-07-31 14:41:57'),(16,4,'rcs','2026-07-31 14:41:57','2026-07-31 14:41:57'),(17,4,'instagram','2026-07-31 14:41:57','2026-07-31 14:41:57'),(18,4,'facebook','2026-07-31 14:41:57','2026-07-31 14:41:57'),(19,4,'website','2026-07-31 14:41:57','2026-07-31 14:41:57'),(23,1,'WHATSAPP','2026-08-21 06:40:26','2026-08-21 06:40:26'),(24,1,'INSTAGRAM','2026-08-21 06:40:36','2026-08-21 06:40:36'),(25,1,'TWITER','2026-08-21 06:40:49','2026-08-21 06:40:49'),(26,1,'LINKDIN','2026-08-21 06:41:01','2026-08-21 06:41:01'),(27,1,'GOOGLE ADS','2026-08-21 06:41:11','2026-08-21 06:41:11'),(28,1,'REFERRALS','2026-08-21 06:41:32','2026-08-21 06:41:32'),(29,1,'OTHERS','2026-08-21 06:42:04','2026-08-21 06:42:04'),(30,1,'WEBSITE','2026-08-21 06:42:13','2026-08-21 06:42:13'),(31,1,'n1','2026-08-21 15:37:15','2026-08-21 15:37:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_custom_values`
--

LOCK TABLES `contact_custom_values` WRITE;
/*!40000 ALTER TABLE `contact_custom_values` DISABLE KEYS */;
INSERT INTO `contact_custom_values` VALUES (82,34,1,8,'mca,mcom'),(83,34,1,9,'Reading, Gaming '),(84,34,1,10,'A1234567'),(85,34,1,11,'24'),(86,29,1,8,'MCA'),(87,29,1,9,'Reading, Gaming'),(88,29,1,10,'A1234567'),(89,29,1,11,'24'),(90,35,1,8,'MCA'),(91,35,1,9,'d'),(92,35,1,10,'d'),(93,35,1,11,'3');
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
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_history`
--

LOCK TABLES `contact_history` WRITE;
/*!40000 ALTER TABLE `contact_history` DISABLE KEYS */;
INSERT INTO `contact_history` VALUES (14,24,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-21 10:21:23'),(15,24,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-21 10:21:50'),(16,24,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-21 10:22:02'),(18,24,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-25 05:30:15'),(19,23,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-25 05:31:32'),(25,24,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-25 05:43:29'),(28,23,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-25 07:28:47'),(35,25,1,1,'follow_up_date','2026-07-24','2026-08-07','2026-07-28 09:14:34'),(36,25,1,1,'follow_up_date','2026-08-06','2026-08-07','2026-07-28 09:15:24'),(37,31,1,1,'follow_up_date','2026-07-30','2026-07-31','2026-07-28 09:48:53'),(38,41,1,1,'follow_up_date','2026-07-27','2026-07-28','2026-07-28 11:48:40'),(43,23,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-28 11:52:14'),(44,31,1,1,'follow_up_date','2026-07-30','2026-07-31','2026-07-28 11:53:18'),(46,24,1,1,'follow_up_date','2026-07-13','2026-07-14','2026-07-28 11:56:33'),(47,26,1,1,'follow_up_date','2026-07-28','2026-07-29','2026-07-28 11:57:27'),(48,27,1,1,'follow_up_date','2026-07-30','2026-07-31','2026-07-28 11:58:11'),(49,28,1,1,'follow_up_date','2026-07-28','2026-07-29','2026-07-28 12:03:00'),(50,47,1,1,'follow_up_date','2026-07-27','2026-07-28','2026-07-31 16:01:47'),(51,40,1,1,'follow_up_date','2026-07-27','2026-07-28','2026-07-31 16:01:58'),(53,45,1,1,'follow_up_date','2026-07-27',NULL,'2026-07-31 17:17:11'),(54,47,1,1,'follow_up_date','2026-07-27','2026-07-28','2026-07-31 17:18:22'),(56,43,1,1,'follow_up_date','2026-07-27','2026-07-28','2026-08-03 06:05:41'),(57,43,1,1,'follow_up_date','2026-07-27','2026-07-28','2026-08-03 06:07:18'),(59,25,1,1,'follow_up_date','2026-08-06','2026-08-07','2026-08-03 06:28:19'),(60,43,1,1,'follow_up_date','2026-07-27',NULL,'2026-08-15 10:07:16'),(61,42,1,1,'follow_up_date','2026-07-27',NULL,'2026-08-15 10:08:08'),(62,52,1,1,'follow_up_date','2026-08-02',NULL,'2026-08-15 10:09:14'),(63,47,1,1,'follow_up_date','2026-07-27',NULL,'2026-08-17 08:29:58'),(104,26,1,32,'follow_up_date','2026-08-27','2026-08-28','2026-08-27 07:59:51'),(105,26,1,1,'follow_up_date','2026-08-27','2026-08-28','2026-08-27 08:02:14'),(107,28,1,32,'follow_up_date','2026-08-27','2026-08-28','2026-08-27 08:15:36'),(108,28,1,31,'follow_up_date','2026-08-27','2026-08-28','2026-08-27 08:16:37'),(109,31,1,1,'follow_up_date','2026-08-30','2026-09-03','2026-09-02 07:21:25'),(110,31,1,1,'follow_up_date','2026-09-02',NULL,'2026-09-10 06:06:36'),(111,29,1,1,'follow_up_date','2026-08-27','2026-08-28','2026-09-10 06:08:45'),(112,29,1,32,'follow_up_date','2026-08-27','2026-08-28','2026-09-10 06:09:34'),(113,29,1,32,'follow_up_date','2026-08-27','2026-08-28','2026-09-10 06:09:46'),(114,28,1,1,'follow_up_date','2026-08-27','2026-08-28','2026-09-11 10:11:03'),(115,28,1,1,'follow_up_date','2026-08-27','2026-08-28','2026-09-11 10:11:12'),(116,34,1,1,'follow_up_date',NULL,'2026-09-18','2026-09-18 11:45:08'),(117,27,1,32,'follow_up_date','2026-08-31','2026-09-01','2026-09-18 12:04:11'),(118,34,1,1,'follow_up_date','2026-09-16','2026-09-17','2026-09-18 12:41:28');
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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (23,5,'Investigation Test Lead','919876543210',NULL,'[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-27 06:12:14',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,27,'follow up ',0,NULL,0,0,NULL,NULL,0,NULL,NULL,28,'[28]',NULL,NULL,0),(24,5,'Investigation Test Lead','919900990099',NULL,'[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-27 06:19:23',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,27,'follow up ',0,NULL,0,0,NULL,NULL,0,NULL,NULL,28,'[28]',NULL,NULL,0),(25,5,'Investigation Test Lead','919900990011',NULL,'[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-27 06:25:26',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,27,'follow up ',0,NULL,0,0,NULL,NULL,0,NULL,NULL,28,'[28]',NULL,NULL,0),(26,1,'Nandan Babu','918129025148','kevin@gmail.com','[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-27 07:59:29',32,'kochi',10,NULL,9,'UFS',12,'MARKETING ',26,'PENDING',2,'2026-08-28',1,0,NULL,NULL,0,NULL,NULL,32,'[32, \"31\"]',NULL,NULL,0),(27,1,'das','912345678901','das@gmail.com','[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-27 08:11:21',31,'alp',10,NULL,9,'UFS',12,'MARKETING ',26,'PENDING',0,'2026-09-01',1,0,NULL,NULL,0,NULL,NULL,1,'[31]',NULL,NULL,0),(28,1,'jasmin','919876543210','jas@gmail.com','[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-27 08:12:20',31,'kochi',10,NULL,9,'UFS',12,'MARKETING ',23,'WON ',4,'2026-08-28',1,1,'2026-09-11 15:41:12',31,1,'2026-09-11 15:41:04',32,1,'[32, \"31\"]',NULL,NULL,1),(29,1,'nayan','914327659801','nay@gmail.com','[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-27 08:13:20',31,'k',10,NULL,9,'UFS',12,'MARKETING ',28,'check',3,'2026-08-27',1,1,'2026-08-27 13:43:21',31,0,NULL,NULL,1,'[31, \"32\"]',NULL,NULL,0),(31,1,'riju','918765432190','r@gmail.com','[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-08-31 13:13:28',32,'ff',10,NULL,9,'UFS',12,'MARKETING ',27,'follow up ',2,NULL,0,0,NULL,NULL,0,NULL,NULL,1,'[32]',NULL,NULL,0),(32,1,'Shalna','917733333344','sss@gmail.com','[\"lead\"]',0,NULL,NULL,'manual','instagram','2026-09-02 07:23:38',1,'Not responding',10,NULL,NULL,NULL,NULL,NULL,24,'LOST ',1,NULL,0,0,NULL,NULL,1,'2026-09-02 12:54:54',1,1,'[1]',NULL,NULL,2),(33,1,'Test MultiCategory','1234567890','multi@example.com',NULL,0,NULL,NULL,'manual','whatsapp','2026-09-18 10:42:01',31,NULL,NULL,NULL,9,'UFS',12,'MARKETING ',23,'WON ',1,NULL,0,1,'2026-09-18 17:15:25',31,0,NULL,NULL,NULL,'[\"31\"]',NULL,NULL,1),(34,1,'Test MultiCategory','911234567891','multi@example.com','[]',0,NULL,NULL,'manual','whatsapp','2026-09-18 10:42:11',32,NULL,NULL,NULL,9,'UFS',12,'MARKETING ',26,'PENDING',4,'2026-09-16',1,0,NULL,NULL,0,NULL,NULL,NULL,'[\"31\", \"32\"]',NULL,NULL,0),(35,1,'das','914536388834',NULL,'[\"lead\"]',0,NULL,NULL,'manual','whatsapp','2026-09-18 12:01:50',32,NULL,NULL,NULL,9,'UFS',12,'MARKETING ',26,'PENDING',2,NULL,0,0,NULL,NULL,0,NULL,NULL,1,'[1, \"32\"]',NULL,NULL,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (38,'MCA in Artificial Intelligence',150000.00,'48','MCA in Artificial Intelligence Course Description\nThe MCA in Artificial Intelligence course is designed to provide students with a comprehensive understanding of AI concepts, techniques, and applications. The curriculum includes:\nCore AI concepts and advanced algorithms\nData mining techniques and neural networks\nDeep learning architectures and AI ethics\nProficiency in programming languages like Python\nStrong mathematical skills including linear algebra, calculus, and probability\nStudents will engage in practical projects and real-world applications to build their expertise in AI. The program also emphasizes critical thinking, problem-solving skills, and communication abilities, which are essential for success in AI-driven roles','2026-08-10 08:31:40','2026-08-10 08:31:40'),(39,'Diploma in Web Development',25000.00,'6','Learn HTML, CSS, JavaScript, and full-stack web development from scratch.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(40,'Python Programming Certification',12000.00,'3','Master Python fundamentals, OOP concepts, and hands-on coding projects.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(41,'Data Science & Machine Learning',55000.00,'9','Comprehensive course covering statistics, Python, ML algorithms, and real-world data projects.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(42,'Digital Marketing Professional',18000.00,'4','Learn SEO, SEM, social media marketing, content strategy, and analytics.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(43,'Graphic Design Masterclass',20000.00,'5','Master Adobe Photoshop, Illustrator, and design principles for print and digital media.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(44,'Advanced Excel & Data Analysis',8000.00,'2','Hands-on training in formulas, pivot tables, dashboards, and data visualization.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(45,'Java Full Stack Development',45000.00,'8','In-depth training in Java, Spring Boot, REST APIs, and front-end frameworks.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(46,'UI/UX Design Fundamentals',22000.00,'4','Learn user research, wireframing, prototyping, and design tools like Figma.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(47,'Cloud Computing with AWS',35000.00,'6','Gain hands-on experience with AWS services, cloud architecture, and deployment.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(48,'Cybersecurity Essentials',30000.00,'6','Understand network security, ethical hacking basics, and threat management.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(49,'Android App Development',28000.00,'5','Build Android apps using Kotlin, Android Studio, and modern app architecture.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(50,'iOS App Development with Swift',30000.00,'5','Learn Swift, Xcode, and how to design and publish iOS applications.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(51,'React JS Development',16000.00,'3','Build dynamic single-page applications using React, hooks, and state management.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(52,'Node.js Backend Development',15000.00,'3','Learn server-side development with Node.js, Express, and REST APIs.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(53,'DevOps Engineering',38000.00,'6','Master CI/CD pipelines, Docker, Kubernetes, and infrastructure automation.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(54,'Artificial Intelligence Fundamentals',40000.00,'6','Introduction to AI concepts, neural networks, and practical AI applications.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(55,'Business Analytics',20000.00,'4','Learn data-driven decision making using Excel, SQL, and Power BI.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(56,'SQL & Database Management',10000.00,'2','Master relational databases, SQL queries, and database design principles.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(57,'Content Writing & Copywriting',9000.00,'2','Develop persuasive writing skills for blogs, ads, and marketing content.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(58,'Financial Accounting Basics',14000.00,'3','Learn bookkeeping, financial statements, and accounting fundamentals.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(59,'Human Resource Management',17000.00,'4','Cover recruitment, employee relations, payroll, and HR compliance.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(60,'Project Management Professional (PMP) Prep',25000.00,'3','Prepare for PMP certification with project planning and risk management concepts.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(61,'Spoken English & Communication Skills',6000.00,'2','Improve fluency, pronunciation, and professional communication skills.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(62,'Interior Design Diploma',42000.00,'8','Learn space planning, 3D modeling, and interior design principles.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(63,'Fashion Designing Course',50000.00,'12','Comprehensive training in garment design, pattern making, and fashion illustration.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(64,'Photography & Videography',15000.00,'3','Master camera techniques, composition, lighting, and video editing.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(65,'Animation & VFX',60000.00,'12','Learn 2D/3D animation, visual effects, and industry-standard software.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(66,'Ethical Hacking Certification',32000.00,'4','Hands-on training in penetration testing and vulnerability assessment.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(67,'Blockchain Development',36000.00,'5','Understand blockchain fundamentals, smart contracts, and DApp development.','2026-08-10 08:31:49','2026-08-10 08:31:49'),(68,'Culinary Arts & Baking',27000.00,'6','Professional training in cooking techniques, baking, and kitchen management.','2026-08-10 08:31:49','2026-08-10 08:31:49');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (12,9,'MARKETING ',NULL,'2026-08-24 13:11:30','2026-08-24 13:11:30'),(13,10,'sales',NULL,'2026-09-10 06:12:47','2026-09-10 06:12:47');
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` VALUES (23,NULL,'SALES HEAD','2026-08-24 13:11:45'),(24,NULL,'MARKETING HEAD ','2026-08-24 13:11:54');
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
INSERT INTO `enquiry_fors` VALUES (10,1,'EDUCATION ','2026-08-21 06:39:06'),(11,1,'SUPPORT ','2026-08-21 06:39:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `field_categories`
--

LOCK TABLES `field_categories` WRITE;
/*!40000 ALTER TABLE `field_categories` DISABLE KEYS */;
INSERT INTO `field_categories` VALUES (3,1,'EDUCATIONS','2026-08-21 07:54:08'),(4,1,'ABOUT ','2026-08-21 07:54:20'),(5,1,'PERSONAL INFO','2026-08-21 07:54:32'),(6,1,'ggg','2026-09-18 12:01:12');
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
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups`
--

LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
INSERT INTO `follow_ups` VALUES (11,23,'My Authorized Phone','2026-07-15','2026-07-15 17:00:56',1,'Admin User',11,'123',5,'ash',1,'123',1,'123','.,nn'),(12,24,'lkjhgf','2026-07-15','2026-07-15 17:08:33',1,'Admin User',11,'123',5,'ash',1,'123',1,'123','jhf'),(13,24,'lkjhgf','2026-07-14','2026-07-21 15:50:16',1,'Admin User',11,'123',5,'ash',1,'123',1,'123',''),(14,24,'lkjhgf','2026-07-14','2026-07-21 15:51:23',1,'Admin User',11,'123',5,'ash',1,'123',1,'123',''),(15,24,'lkjhgf','2026-07-14','2026-07-21 15:51:50',1,'Admin User',11,'123',5,'ash',1,'123',1,'123',''),(16,24,'lkjhgf','2026-07-14','2026-07-21 15:52:02',1,'Admin User',11,'123',5,'ash',1,'123',1,'123',''),(18,23,'My Authorized Phone','2026-07-14','2026-07-25 11:00:05',1,'Admin User',11,'123',5,'ash',1,'123',1,'123',''),(19,24,'lkjhgf','2026-07-14','2026-07-25 11:00:15',1,'Admin User',11,'123',6,'gem',1,'123',1,'123',''),(20,23,'My Authorized Phone','2026-07-14','2026-07-25 11:01:32',1,'Admin User',14,'riju',5,'ash',1,'123',1,'123',''),(26,24,'lkjhgf','2026-07-14','2026-07-25 11:13:29',1,'Admin User',11,'123',6,'gem',1,'123',1,'123','gg'),(30,23,'My Authorized Phone','2026-07-14','2026-07-25 12:58:47',1,'Admin User',14,'riju',5,'ash',1,'123',1,'123','r'),(31,25,'Nandan Babu','2026-07-25','2026-07-25 12:59:52',1,'Admin User',11,'123',5,'ash',1,'123',1,'123','ff'),(33,26,'test','2026-07-27','2026-07-27 09:41:37',1,'Admin User',1,'Admin User',6,'gem',NULL,NULL,NULL,NULL,'Contact created'),(39,27,'ggy','2026-07-31','2026-07-27 15:45:47',1,'Admin User',1,'Admin User',9,'geng',NULL,NULL,NULL,NULL,'Contact created'),(40,28,'jaya','2026-07-29','2026-07-27 15:46:29',1,'Admin User',1,'Admin User',10,'prx',NULL,NULL,NULL,NULL,'Contact created'),(41,29,'dfghjk','2026-07-27','2026-07-27 15:55:36',1,'Admin User',13,'test',8,'sen',1,'123',1,'123','gh'),(43,25,'Nandan Babu','2026-08-07','2026-07-28 14:44:34',1,'Admin User',11,'123',5,'ash',1,'123',1,'123',''),(44,25,'Nandan Babu','2026-08-07','2026-07-28 14:45:24',1,'Admin User',11,'123',5,'ash',1,'123',1,'123',''),(45,31,'Nandan Babu','2026-07-31','2026-07-28 14:49:01',1,'Admin User',11,'123',11,'rtx',1,'123',1,'123','h'),(46,31,'Nandan Babu','2026-07-31','2026-07-28 15:18:53',1,'Admin User',15,'riju2',11,'rtx',1,'123',1,'123',''),(47,32,'Nandan Babu','2026-07-29','2026-07-28 15:22:10',1,'Admin User',19,'nandan',11,'rtx',1,'123',1,'123','ff'),(48,32,'Nandan Babu','2026-07-28','2026-07-28 15:23:42',19,'nandan',19,'nandan',11,'rtx',1,'123',1,'123',''),(49,33,'shalu','2026-07-31','2026-07-28 15:25:10',1,'Admin User',19,'nandan',5,'ash',1,'123',1,'123','hi'),(50,34,'alma','2026-07-31','2026-07-28 15:33:20',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','ddd'),(51,35,'hh','2026-07-28','2026-07-28 15:34:18',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','dd'),(52,36,'machu','2026-07-28','2026-07-28 15:37:15',1,'Admin User',19,'nandan',11,'rtx',1,'123',1,'123','wa'),(53,37,'machuugyda','2026-07-28','2026-07-28 15:43:07',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','s'),(54,38,'ysga','2026-07-28','2026-07-28 15:44:34',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','d'),(55,39,'v','2026-07-28','2026-07-28 15:51:53',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','f'),(56,40,'d','2026-07-28','2026-07-28 15:52:45',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','d'),(57,41,'f','2026-07-28','2026-07-28 15:56:43',1,'Admin User',11,'123',8,'sen',1,'123',1,'123','x'),(58,42,'r','2026-07-28','2026-07-28 16:13:31',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','f'),(59,43,'d','2026-07-28','2026-07-28 16:30:31',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','ff'),(60,44,'f',NULL,'2026-07-28 16:49:20',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','f'),(61,45,'s','2026-07-28','2026-07-28 16:55:15',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','vv'),(63,47,'b','2026-07-28','2026-07-28 17:07:21',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','g'),(65,49,'s',NULL,'2026-07-28 17:15:10',1,'Admin User',19,'nandan',11,'rtx',1,'123',1,'123','d'),(66,50,'c',NULL,'2026-07-28 17:17:30',1,'Admin User',19,'nandan',11,'rtx',1,'123',1,'123','d'),(67,41,'f','2026-07-28','2026-07-28 17:18:39',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123',''),(74,44,'f',NULL,'2026-07-28 17:21:49',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123',''),(76,23,'My Authorized Phone','2026-07-14','2026-07-28 17:22:14',1,'Admin User',19,'nandan',5,'ash',1,'123',1,'123',''),(77,31,'Nandan Babu','2026-07-31','2026-07-28 17:23:18',1,'Admin User',19,'nandan',11,'rtx',1,'123',1,'123',''),(79,24,'lkjhgf','2026-07-14','2026-07-28 17:26:33',1,'Admin User',19,'nandan',11,'rtx',1,'123',1,'123',''),(80,26,'test','2026-07-29','2026-07-28 17:27:27',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123',''),(81,27,'ggy','2026-07-31','2026-07-28 17:28:11',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123',''),(82,28,'jaya','2026-07-29','2026-07-28 17:33:00',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123',''),(83,47,'b','2026-07-28','2026-07-31 21:31:47',1,'Admin User',14,'riju',8,'sen',1,'123',1,'123',''),(84,40,'d','2026-07-28','2026-07-31 21:31:58',1,'Admin User',18,'albin',8,'sen',1,'123',1,'123',''),(86,51,'testtt',NULL,'2026-07-31 22:41:45',1,'Admin User',19,'nandan',12,'won',1,'123',1,'123','h'),(87,45,'s',NULL,'2026-07-31 22:47:11',1,'Admin User',18,'albin',12,'won',1,'123',1,'123',''),(88,47,'b','2026-07-28','2026-07-31 22:48:22',1,'Admin User',14,'riju',10,'prx',1,'123',1,'123',''),(89,51,'testtt',NULL,'2026-07-31 22:56:56',1,'Admin User',19,'nandan',12,'won',1,'123',1,'123',''),(91,43,'d','2026-07-28','2026-08-03 11:35:41',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123',''),(92,43,'d','2026-07-28','2026-08-03 11:37:18',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123','j'),(93,52,'test333','2026-08-03','2026-08-03 11:51:26',1,'Admin User',20,'shallu',13,'usa',3,'test1',3,'branch head ','test1'),(95,25,'Nandan Babu','2026-08-07','2026-08-03 11:58:19',1,'Admin User',18,'albin',11,'rtx',1,'123',1,'123','h'),(96,51,'testtt',NULL,'2026-08-07 16:05:37',1,'Admin User',19,'nandan',21,'NO DATE ',1,'123',1,'123',''),(97,50,'c',NULL,'2026-08-07 16:05:42',1,'Admin User',19,'nandan',21,'NO DATE ',1,'123',1,'123',''),(98,49,'s',NULL,'2026-08-07 16:05:47',1,'Admin User',19,'nandan',21,'NO DATE ',1,'123',1,'123',''),(99,45,'s',NULL,'2026-08-07 16:05:52',1,'Admin User',18,'albin',21,'NO DATE ',1,'123',1,'123',''),(100,44,'f',NULL,'2026-08-07 16:05:56',1,'Admin User',19,'nandan',21,'NO DATE ',1,'123',1,'123',''),(112,43,'d',NULL,'2026-08-15 15:37:16',1,'Admin User',19,'nandan',9,'geng',1,'123',1,'123',''),(113,42,'r',NULL,'2026-08-15 15:38:08',1,'Admin User',19,'nandan',8,'sen',1,'123',1,'123',''),(114,52,'test333',NULL,'2026-08-15 15:39:14',1,'Admin User',20,'shallu',10,'prx',3,'test1',3,'branch head ',''),(115,47,'b',NULL,'2026-08-17 13:59:58',1,'Admin User',20,'shallu',12,'won',3,'test1',3,'branch head ',''),(119,55,'Nandan Babu',NULL,'2026-08-21 10:17:49',1,'Admin User',19,'nandan',12,'won',1,'123',1,'123','hui'),(184,23,'Investigation Test Lead',NULL,'2026-08-27 11:42:14',28,'QA Tester',28,'QA Tester',27,'follow up ',NULL,NULL,NULL,NULL,'Contact created'),(185,24,'Investigation Test Lead',NULL,'2026-08-27 11:49:23',28,'QA Tester',28,'QA Tester',27,'follow up ',NULL,NULL,NULL,NULL,'Contact created'),(186,25,'Investigation Test Lead',NULL,'2026-08-27 11:55:26',28,'QA Tester',28,'QA Tester',27,'follow up ',NULL,NULL,NULL,NULL,'Contact created'),(187,26,'Nandan Babu','2026-08-28','2026-08-27 13:29:29',32,'MILAN',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ','k'),(188,26,'Nandan Babu','2026-08-28','2026-08-27 13:29:51',32,'MILAN',31,'KEVIN',26,'PENDING',9,'UFS',11,'SALES',''),(189,26,'Nandan Babu','2026-08-28','2026-08-27 13:32:14',1,'Admin User',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ',''),(191,27,'das','2026-09-01','2026-08-27 13:41:21',1,'Admin User',31,'KEVIN',26,'PENDING',9,'UFS',12,'MARKETING ','c'),(192,28,'jasmin','2026-08-28','2026-08-27 13:42:20',1,'Admin User',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ','j'),(193,29,'nayan','2026-08-28','2026-08-27 13:43:20',1,'Admin User',31,'KEVIN',23,'WON ',9,'UFS',12,'MARKETING ','d'),(195,28,'jasmin','2026-08-28','2026-08-27 13:45:36',32,'MILAN',31,'KEVIN',26,'PENDING',9,'UFS',12,'MARKETING ','pls'),(196,28,'jasmin','2026-08-28','2026-08-27 13:46:37',31,'KEVIN',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ','i cant'),(198,31,'riju','2026-08-31','2026-08-31 18:43:28',1,'Admin User',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ','c'),(199,31,'riju','2026-09-03','2026-09-02 12:51:25',1,'Admin User',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ','details given c v pending '),(200,32,'Shalna',NULL,'2026-09-02 12:53:38',1,'Admin User',1,'Admin User',27,'follow up ',NULL,NULL,NULL,NULL,'Contact created'),(201,32,'Shalna',NULL,'2026-09-02 12:54:54',1,'Admin User',1,'Admin User',24,'LOST ',NULL,NULL,NULL,NULL,''),(202,31,'riju',NULL,'2026-09-10 11:36:36',1,'Admin User',32,'MILAN',27,'follow up ',9,'UFS',12,'MARKETING ','chehck'),(203,29,'nayan','2026-08-28','2026-09-10 11:38:45',1,'Admin User',32,'MILAN',28,'check',9,'UFS',12,'MARKETING ',''),(204,29,'nayan','2026-08-28','2026-09-10 11:39:34',32,'MILAN',31,'KEVIN',28,'check',9,'UFS',12,'MARKETING ',''),(205,29,'nayan','2026-08-28','2026-09-10 11:39:46',32,'MILAN',32,'MILAN',28,'check',9,'UFS',12,'MARKETING ',''),(206,28,'jasmin','2026-08-28','2026-09-11 15:41:03',1,'Admin User',32,'MILAN',24,'LOST ',9,'UFS',12,'MARKETING ',''),(207,28,'jasmin','2026-08-28','2026-09-11 15:41:12',1,'Admin User',31,'KEVIN',23,'WON ',9,'UFS',12,'MARKETING ',''),(208,34,'Test MultiCategory','2026-09-18','2026-09-18 17:15:08',1,'Admin User',31,'KEVIN',26,'PENDING',9,'UFS',12,'MARKETING ',''),(209,33,'Test MultiCategory',NULL,'2026-09-18 17:15:25',1,'Admin User',31,'KEVIN',23,'WON ',9,'UFS',12,'MARKETING ',''),(210,29,'nayan','2026-08-27','2026-09-18 17:30:17',31,'KEVIN',31,'KEVIN',28,'check',9,'UFS',12,'MARKETING ',''),(211,35,'das',NULL,'2026-09-18 17:31:50',1,'Admin User',1,'Admin User',27,'follow up ',NULL,NULL,NULL,NULL,'Contact created'),(212,35,'das',NULL,'2026-09-18 17:32:10',1,'Admin User',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ',''),(213,35,'das',NULL,'2026-09-18 17:33:08',1,'Admin User',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ',''),(214,27,'das','2026-09-01','2026-09-18 17:34:11',32,'MILAN',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ',''),(215,34,'Test MultiCategory','2026-09-17','2026-09-18 18:10:35',31,'KEVIN',31,'KEVIN',26,'PENDING',9,'UFS',12,'MARKETING ',''),(216,34,'Test MultiCategory','2026-09-17','2026-09-18 18:11:28',1,'Admin User',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ',''),(217,34,'Test MultiCategory','2026-09-16','2026-09-18 18:11:48',32,'MILAN',32,'MILAN',26,'PENDING',9,'UFS',12,'MARKETING ','');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_fields`
--

LOCK TABLES `lead_fields` WRITE;
/*!40000 ALTER TABLE `lead_fields` DISABLE KEYS */;
INSERT INTO `lead_fields` VALUES (8,1,'Course','course','dropdown','[\"mca\", \"mcom\"]',0,0,'2026-09-09 12:28:35',3),(9,1,'Hobbies','hobbies','text',NULL,0,0,'2026-09-18 10:40:44',4),(10,1,'Passport Number','passport_number','text',NULL,0,0,'2026-09-18 10:40:44',5),(11,1,'Age','age','number',NULL,0,0,'2026-09-18 10:40:44',5);
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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (21,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: sdfjkl',22,1,'2026-07-28 11:54:02'),(22,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: lkjhgf',24,1,'2026-07-28 11:56:33'),(23,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: test',26,1,'2026-07-28 11:57:27'),(24,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: ggy',27,1,'2026-07-28 11:58:12'),(25,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: jaya',28,1,'2026-07-28 12:03:00'),(26,1,14,'assignment','Contact Reassigned','A contact has been assigned to you: b',47,0,'2026-07-31 16:01:47'),(27,1,18,'assignment','Contact Reassigned','A contact has been assigned to you: d',40,0,'2026-07-31 16:01:58'),(28,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: c',48,0,'2026-07-31 17:05:13'),(29,1,19,'assignment','New Contact Assigned','You have been assigned a new contact: testtt',51,0,'2026-07-31 17:11:45'),(30,1,18,'assignment','Contact Reassigned','A contact has been assigned to you: s',45,0,'2026-07-31 17:17:11'),(31,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: testtt',51,0,'2026-07-31 17:26:56'),(32,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: c',48,0,'2026-08-03 05:54:49'),(33,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: d',43,0,'2026-08-03 06:05:41'),(34,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: d',43,0,'2026-08-03 06:07:18'),(35,1,20,'assignment','New Contact Assigned','You have been assigned a new contact: test333',52,0,'2026-08-03 06:21:26'),(36,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: d',46,0,'2026-08-03 06:22:22'),(37,1,18,'assignment','Contact Reassigned','A contact has been assigned to you: Nandan Babu',25,0,'2026-08-03 06:28:19'),(38,1,19,'assignment','Contact Reassigned','A contact has been assigned to you: r',42,0,'2026-08-15 10:08:08'),(39,1,20,'assignment','Contact Reassigned','A contact has been assigned to you: b',47,0,'2026-08-17 08:29:58'),(40,1,20,'assignment','New Contact Assigned','You have been assigned a new contact: kavatta thala',53,0,'2026-08-18 04:47:49'),(41,1,20,'assignment','Contact Reassigned','A contact has been assigned to you: kavatta thalay',53,0,'2026-08-19 05:05:18'),(42,1,21,'assignment','New Contact Assigned','You have been assigned a new contact: rohit',54,0,'2026-08-21 04:39:53'),(43,1,19,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',55,0,'2026-08-21 04:47:49'),(54,1,23,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-21 08:14:46'),(55,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,1,'2026-08-21 08:15:00'),(57,1,24,'assignment','Contact Reassigned','A contact has been assigned to you: AMITH  ',7,0,'2026-08-21 08:21:23'),(58,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-21 16:11:43'),(59,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-22 04:30:22'),(60,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',8,0,'2026-08-24 05:52:51'),(62,1,23,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-24 06:15:29'),(63,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 06:21:48'),(64,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 06:22:13'),(65,1,27,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 08:18:19'),(66,1,27,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 09:33:05'),(67,1,24,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 10:00:10'),(68,1,24,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 10:00:56'),(69,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 10:11:44'),(70,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 10:11:50'),(71,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-24 11:34:35'),(72,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 11:34:53'),(73,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 11:35:04'),(74,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-24 11:35:15'),(75,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: JAYASREE',8,0,'2026-08-24 11:42:14'),(76,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: ALMA',6,0,'2026-08-24 11:42:27'),(77,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-24 11:42:37'),(78,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: SWAROOP',3,0,'2026-08-24 11:42:46'),(79,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: ROHITH',2,0,'2026-08-24 11:42:57'),(80,1,26,'assignment','Contact Reassigned','A contact has been assigned to you: ADHIL ',1,0,'2026-08-24 11:44:05'),(81,1,29,'assignment','Contact Reassigned','A contact has been assigned to you: SHALU',4,0,'2026-08-24 11:51:17'),(82,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',11,0,'2026-08-24 11:58:25'),(83,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',9,0,'2026-08-24 11:58:25'),(84,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',10,0,'2026-08-24 11:58:25'),(85,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE babu',12,0,'2026-08-24 11:58:25'),(86,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',13,0,'2026-08-24 11:58:25'),(87,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: Nandan Babu',14,0,'2026-08-24 11:58:51'),(88,1,22,'assignment','Contact Reassigned','A contact has been assigned to you: Nandan Babu',14,0,'2026-08-24 12:25:48'),(89,1,24,'assignment','New Contact Assigned','You have been assigned a new contact: ajay',15,0,'2026-08-24 12:31:10'),(90,1,30,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',16,0,'2026-08-24 12:36:45'),(91,1,23,'assignment','Contact Reassigned','A contact has been assigned to you: JAYASREE',16,0,'2026-08-24 12:37:01'),(92,1,25,'assignment','New Contact Assigned','You have been assigned a new contact: JAYASREE',17,0,'2026-08-24 12:43:39'),(93,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: shalu',17,0,'2026-08-24 12:44:15'),(94,1,25,'assignment','Contact Reassigned','A contact has been assigned to you: shalu',17,0,'2026-08-24 12:46:06'),(106,5,28,'assignment','New Contact Assigned','You have been assigned a new contact: Investigation Test Lead',23,0,'2026-08-27 06:12:14'),(107,5,28,'assignment','New Contact Assigned','You have been assigned a new contact: Investigation Test Lead',24,0,'2026-08-27 06:19:23'),(108,5,28,'assignment','New Contact Assigned','You have been assigned a new contact: Investigation Test Lead',25,0,'2026-08-27 06:25:26'),(125,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: nayan',29,0,'2026-09-10 06:09:34'),(128,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: jasmin',28,0,'2026-09-11 10:11:12'),(129,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 11:45:08'),(130,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',33,0,'2026-09-18 11:45:25'),(131,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: nayan',29,0,'2026-09-18 12:00:17'),(136,1,31,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 12:40:35'),(137,1,32,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 12:41:28'),(138,1,32,'assignment','Contact Reassigned','A contact has been assigned to you: Test MultiCategory',34,0,'2026-09-18 12:41:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (23,'WON ','Yes','#4F46E5',0,'2026-08-21 06:37:15','2026-08-21 06:37:15',1,6,'sale'),(24,'LOST ','Yes','#4F46E5',0,'2026-08-21 06:37:27','2026-08-21 06:37:27',1,6,'sale_lost'),(26,'PENDING','Yes','#4F46E5',0,'2026-08-21 06:47:57','2026-08-21 06:47:57',1,6,NULL),(27,'follow up ','No','#4F46E5',0,'2026-08-24 13:09:34','2026-08-24 13:09:34',0,NULL,NULL),(28,'check','Yes','#4F46E5',0,'2026-09-10 06:08:35','2026-09-10 06:08:35',1,12,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,1,'__agent_18',NULL,'2026-07-25 05:06:35'),(5,1,'__agent_20',NULL,'2026-08-03 06:01:10'),(6,1,'__agent_19',NULL,'2026-08-04 05:01:17'),(7,1,'__agent_17',NULL,'2026-08-19 04:08:52'),(8,1,'__agent_21',NULL,'2026-08-19 04:09:33'),(12,1,'__agent_26',NULL,'2026-08-21 16:11:12');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES (1,1,'welcome_offer','MARKETING','en','none',NULL,'Hi {{1}}! Welcome to UrbanChat. Enjoy 20% off your first order with code URBAN20. Shop now!','Reply STOP to unsubscribe',NULL,'approved',NULL,'2026-04-29 08:59:39'),(2,1,'order_confirmation','UTILITY','en','none',NULL,'Hi {{1}}, your order #{{2}} has been confirmed! Total: ₹{{3}}. We will notify you once shipped.','Thank you for shopping with us!',NULL,'approved',NULL,'2026-04-29 08:59:39');
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `role` enum('superadmin','admin','agent') DEFAULT 'agent',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(255) DEFAULT NULL,
  `agent_status` enum('active','inactive') DEFAULT 'active',
  `designation_id` int DEFAULT NULL,
  `employee_code` varchar(100) DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `permissions` text,
  `allowed_custom_field_categories` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `business_id` (`business_id`),
  KEY `fk_users_branch` (`branch_id`),
  KEY `fk_users_department` (`department_id`),
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,NULL,NULL,'Admin User','admin','$2b$10$0ZxQN0dfmJL2E73gWlgT.u2bT2Bo9CI4WcZQmHW3hvlI5e70JP7au','admin',1,'2026-04-29 08:59:39',NULL,'active',22,'1','2023-01-07','[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Inbox\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Broadcasts\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Chatbots\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Templates\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Settings\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Teams\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Branch\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Department\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Designation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Intake\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Year\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Application Status\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Enquiry For\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Document Type\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channel\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Channels Manager\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Users / Agents\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Lead Fields\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Field Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Source Categories\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"API & Webhooks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Integrations\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Courses\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"HR\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Leave Request\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true}]',NULL),(4,3,NULL,NULL,'salman s','admin1','$2b$10$0ZxQN0dfmJL2E73gWlgT.u2bT2Bo9CI4WcZQmHW3hvlI5e70JP7au','admin',1,'2026-04-29 10:17:22',NULL,'active',NULL,NULL,NULL,NULL,NULL),(5,4,NULL,NULL,'Salman S ','salmansajeer7@gmail.com','$2b$10$0ZxQN0dfmJL2E73gWlgT.u2bT2Bo9CI4WcZQmHW3hvlI5e70JP7au','admin',1,'2026-04-30 03:47:18',NULL,'active',NULL,NULL,NULL,NULL,NULL),(28,5,NULL,NULL,'QA Tester','test_qa@example.com','$2b$10$PyV1SM3flWmA5hVPiTv0EuZvymu3uT84JyaOtrgASPcpaYwTDItz.','admin',1,'2026-08-22 09:44:25',NULL,'active',NULL,NULL,NULL,NULL,NULL),(31,1,9,12,'KEVIN','kevin@gmail.com','$2b$10$WpAr2v/4TanrEVU4FBHjsOVAZz0/8oikEX4XyGpZ/bUSpoLHbUUzy','agent',1,'2026-08-24 13:12:51','KEVIN','active',23,'101','2025-12-31','[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Inbox\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Broadcasts\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Chatbots\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Templates\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Reports\",\"view\":true,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Settings\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Teams\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Branch\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Department\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Designation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Intake\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Year\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Application Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Enquiry For\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Document Type\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channel\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channels Manager\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Users / Agents\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Fields\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Field Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Source Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"API & Webhooks\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Integrations\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Courses\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"HR\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Leave Request\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false}]','[3]'),(32,1,9,12,'MILAN','milan@gmail.com','$2b$10$ARaTcLpjaqUha7kHjoxZy.jMDzp1x7tIjEDnQTizu6HPPEu5IvAJy','agent',1,'2026-08-24 13:13:35','MILAN','active',24,'102','2026-06-06','[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Inbox\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Broadcasts\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Chatbots\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Templates\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Reports\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Settings\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Teams\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Branch\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Department\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Designation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Intake\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Year\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Application Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Enquiry For\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Document Type\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channel\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channels Manager\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Users / Agents\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Fields\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Field Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Source Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"API & Webhooks\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Integrations\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Courses\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Operation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"HR\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Leave Request\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false}]','[4]');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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

-- Dump completed on 2026-09-22 14:14:47
