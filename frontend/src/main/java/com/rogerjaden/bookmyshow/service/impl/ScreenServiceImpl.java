package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateScreenRequest;
import com.rogerjaden.bookmyshow.dto.response.ScreenResponse;
import com.rogerjaden.bookmyshow.entity.Screen;
import com.rogerjaden.bookmyshow.entity.Theatre;
import com.rogerjaden.bookmyshow.entity.enums.ScreenStatus;
import com.rogerjaden.bookmyshow.entity.enums.TheatreStatus;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.ScreenRepository;
import com.rogerjaden.bookmyshow.repository.TheatreRepository;
import com.rogerjaden.bookmyshow.repository.SeatRepository;
import com.rogerjaden.bookmyshow.service.interfaces.ScreenService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;

@Service
@Transactional
public class ScreenServiceImpl implements ScreenService {
    private final ScreenRepository screenRepository;
    private final TheatreRepository theatreRepository;
    private final SeatRepository seatRepository;

    public ScreenServiceImpl(ScreenRepository screenRepository, TheatreRepository theatreRepository,
                             SeatRepository seatRepository) {
        this.screenRepository = screenRepository;
        this.theatreRepository = theatreRepository;
        this.seatRepository = seatRepository;
    }

    @Override
    public ScreenResponse createScreen(CreateScreenRequest request) {
        Theatre theatre = findTheatre(request.theatreId());
        if (theatre.getStatus() != TheatreStatus.ACTIVE)
            throw new IllegalStateException("Cannot add a screen to an inactive theatre.");
        String name = request.screenName().trim();
        if (screenRepository.existsByTheatre_IdAndScreenNameIgnoreCase(theatre.getId(), name))
            throw new ConflictException("A screen with this name already exists in this theatre.");

        Screen screen = new Screen();
        screen.setTheatre(theatre);
        screen.setScreenName(name);
        screen.setScreenType(request.screenType());
        screen.setStatus(request.status());
        return toResponse(screenRepository.save(screen));
    }

    @Override
    public ScreenResponse updateScreen(Long screenId, CreateScreenRequest request) {
        Screen screen = findScreen(screenId);
        Theatre theatre = findTheatre(request.theatreId());
        if (theatre.getStatus() != TheatreStatus.ACTIVE)
            throw new IllegalStateException("Cannot assign a screen to an inactive theatre.");

        String name = request.screenName().trim();
        screenRepository.findByTheatre_Id(theatre.getId()).stream()
            .filter(s -> !s.getId().equals(screenId))
            .filter(s -> s.getScreenName().equalsIgnoreCase(name))
            .findAny()
            .ifPresent(s -> { throw new ConflictException("A screen with this name already exists in this theatre."); });

        // Moving a screen between theatres is permitted only if the caller explicitly supplies the new theatreId.
        screen.setTheatre(theatre);
        screen.setScreenName(name);
        screen.setScreenType(request.screenType());
        screen.setStatus(request.status());
        return toResponse(screenRepository.save(screen));
    }

    @Override
    @Transactional(readOnly = true)
    public ScreenResponse getScreenById(Long screenId) {
        return toResponse(findScreen(screenId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScreenResponse> getScreensByTheatre(Long theatreId) {
        findTheatre(theatreId);
        return screenRepository.findByTheatre_IdAndStatus(theatreId, ScreenStatus.ACTIVE)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public void deactivateScreen(Long screenId) {
        Screen screen = findScreen(screenId);
        if (seatRepository.countByScreen_Id(screenId) > 0) {
            // Physical seats can be referenced by future shows/bookings; keep the screen but mark it inactive.
            screen.setStatus(ScreenStatus.INACTIVE);
            screenRepository.save(screen);
            return;
        }
        screen.setStatus(ScreenStatus.INACTIVE);
        screenRepository.save(screen);
    }

    private Screen findScreen(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("screenId must be positive.");
        return screenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found: " + id));
    }

    private Theatre findTheatre(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("theatreId must be positive.");
        return theatreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theatre not found: " + id));
    }

    private ScreenResponse toResponse(Screen s) {
        return new ScreenResponse(s.getId(), s.getTheatre().getId(), s.getScreenName(),
                s.getScreenType(), s.getStatus());
    }
}
