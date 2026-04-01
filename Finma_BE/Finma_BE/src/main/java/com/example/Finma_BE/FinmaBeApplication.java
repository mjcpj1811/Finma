package com.example.Finma_BE;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinmaBeApplication {

	public static void main(String[] args) {
		SpringApplication.run(FinmaBeApplication.class, args);
	}

}
