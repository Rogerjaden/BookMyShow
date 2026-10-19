package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateTheatreRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateTheatreRequest;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.dto.response.TheatreResponse;
import com.rogerjaden.bookmyshow.entity.Theatre;
import com.rogerjaden.bookmyshow.entity.enums.TheatreStatus;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.TheatreRepository;
import com.rogerjaden.bookmyshow.repository.ScreenRepository;
import com.rogerjaden.bookmyshow.service.interfaces.TheatreService;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class TheatreServiceImpl implements TheatreService {
    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;

    public TheatreServiceImpl(TheatreRepository theatreRepository, ScreenRepository screenRepository) {
        this.theatreRepository = theatreRepository;
        this.screenRepository = screenRepository;
    }

    @Override
    public TheatreResponse createTheatre(CreateTheatreRequest request) {
        Theatre theatre = new Theatre();
        theatre.setName(request.name().trim());
        theatre.setAddressLine(request.addressLine().trim());
        theatre.setCity(request.city().trim());
        theatre.setState(request.state().trim());
        theatre.setPostalCode(request.postalCode().trim());
        theatre.setStatus(request.status());
        return toResponse(theatreRepository.save(theatre));
    }

    @Override
    public TheatreResponse updateTheatre(Long theatreId, UpdateTheatreRequest request) {
        Theatre theatre = findTheatre(theatreId);
        theatre.setName(request.name().trim());
        theatre.setAddressLine(request.addressLine().trim());
        theatre.setCity(request.city().trim());
        theatre.setState(request.state().trim());
        theatre.setPostalCode(request.postalCode().trim());
        theatre.setStatus(request.status());
        return toResponse(theatreRepository.save(theatre));
    }

    @Override
    @Transactional(readOnly = true)
    public TheatreResponse getTheatreById(Long theatreId) {
        return toResponse(findTheatre(theatreId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TheatreResponse> getTheatres(String city, int page, int size) {
        validatePage(page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        Page<Theatre> results;
        if (StringUtils.hasText(city)) {
            results = theatreRepository.findByCityIgnoreCaseAndStatus(city.trim(), TheatreStatus.ACTIVE, pageable);
        } else {
            results = theatreRepository.findByStatus(TheatreStatus.ACTIVE, pageable);
        }
        return new PageResponse<>(results.getContent().stream().map(this::toResponse).toList(),
                results.getNumber(), results.getSize(), results.getTotalElements(),
                results.getTotalPages(), results.isLast());
    }

    @Override
    public void deactivateTheatre(Long theatreId) {
        Theatre theatre = findTheatre(theatreId);
        if (screenRepository.findByTheatre_IdAndStatus(theatreId,
                com.rogerjaden.bookmyshow.entity.enums.ScreenStatus.ACTIVE).size() > 0) {
            throw new IllegalStateException("Deactivate active screens before deactivating this theatre.");
        }
        theatre.setStatus(TheatreStatus.INACTIVE);
        theatreRepository.save(theatre);
    }

    private Theatre findTheatre(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("theatreId must be positive.");
        return theatreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theatre not found: " + id));
    }

    private void validatePage(int page, int size) {
        if (page < 0) throw new IllegalArgumentException("page must be zero or greater.");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size must be between 1 and 100.");
    }

    private TheatreResponse toResponse(Theatre t) {
        return new TheatreResponse(t.getId(), t.getName(), t.getAddressLine(), t.getCity(),
                t.getState(), t.getPostalCode(), t.getStatus(), t.getCreatedAt(), t.getUpdatedAt());
    }
}
