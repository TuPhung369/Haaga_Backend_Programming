package com.database.study.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NovuConfig {

    @Value("${novu.api-key:dummy-key}")
    private String novuApiKey;

    // Temporarily disabled Novu configuration due to package issues
    /*
    @Bean
    public ApiClient novuApiClient() {
        ApiClient apiClient = new ApiClient();
        apiClient.setApiKey(novuApiKey);
        return apiClient;
    }

    @Bean
    public NotificationsApi notificationsApi(ApiClient apiClient) {
        return new NotificationsApi(apiClient);
    }

    @Bean
    public SubscribersApi subscribersApi(ApiClient apiClient) {
        return new SubscribersApi(apiClient);
    }

    @Bean
    public TopicsApi topicsApi(ApiClient apiClient) {
        return new TopicsApi(apiClient);
    }
    */
}
