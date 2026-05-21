package com.cinema.cenimabackend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.*;
import org.springframework.data.redis.serializer.*;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public GenericJackson2JsonRedisSerializer redisJsonSerializer() {
        ObjectMapper mapper = new ObjectMapper();

        // Hỗ trợ LocalDate, LocalDateTime, Instant...
        mapper.registerModule(new JavaTimeModule());

        // Không lưu date thành dạng timestamp array
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Cần cho GenericJackson2JsonRedisSerializer khi deserialize Object
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        return new GenericJackson2JsonRedisSerializer(mapper);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory factory,
            GenericJackson2JsonRedisSerializer redisJsonSerializer
    ) {
        RedisTemplate<String, Object> tpl = new RedisTemplate<>();
        tpl.setConnectionFactory(factory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        tpl.setKeySerializer(stringSerializer);
        tpl.setHashKeySerializer(stringSerializer);
        tpl.setValueSerializer(redisJsonSerializer);
        tpl.setHashValueSerializer(redisJsonSerializer);

        tpl.afterPropertiesSet();
        return tpl;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }

    @Bean
    public RedisCacheManager cacheManager(
            RedisConnectionFactory factory,
            GenericJackson2JsonRedisSerializer redisJsonSerializer
    ) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(redisJsonSerializer)
                );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(Map.of(
                        "movies", defaultConfig.entryTtl(Duration.ofMinutes(30)),
                        "cinemas", defaultConfig.entryTtl(Duration.ofHours(2)),
                        "genres", defaultConfig.entryTtl(Duration.ofHours(6)),
                        "seatmaps", defaultConfig.entryTtl(Duration.ofSeconds(60))
                ))
                .build();
    }
}